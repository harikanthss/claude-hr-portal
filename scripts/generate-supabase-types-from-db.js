#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const { Client } = require(path.join(rootDir, 'backend', 'node_modules', 'pg'));
const outFile = path.join(rootDir, 'frontend', 'src', 'types', 'supabase.ts');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getConnectionString() {
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, 'backend', '.env'));

  return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
}

function shouldUseSsl(connectionString) {
  if (process.env.PGSSLMODE === 'disable') return false;
  return /supabase\.(co|com)|pooler\.supabase\.com/i.test(connectionString);
}

function pgTypeToTs(column) {
  if (column.data_type === 'USER-DEFINED') {
    return `Database["public"]["Enums"]["${column.udt_name}"]`;
  }

  if (column.data_type === 'ARRAY') return 'unknown[]';

  switch (column.data_type) {
    case 'bigint':
    case 'double precision':
    case 'integer':
    case 'numeric':
    case 'real':
    case 'smallint':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'json':
    case 'jsonb':
      return 'Json';
    case 'date':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
    case 'time with time zone':
    case 'time without time zone':
    case 'uuid':
    case 'character varying':
    case 'text':
      return 'string';
    default:
      return 'unknown';
  }
}

function withNull(type, nullable) {
  return nullable ? `${type} | null` : type;
}

function propertyLine(name, optional, type) {
  return `          ${JSON.stringify(name)}${optional ? '?' : ''}: ${type}`;
}

async function main() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error('Set SUPABASE_DB_URL or DATABASE_URL before running this script.');
  }

  const client = new Client({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  try {
    const tablesResult = await client.query(
      `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name
      `,
    );

    const columnsResult = await client.query(
      `
      select
        table_name,
        column_name,
        data_type,
        udt_name,
        is_nullable = 'YES' as is_nullable,
        column_default is not null as has_default,
        is_identity = 'YES' as is_identity
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
      `,
    );

    const enumsResult = await client.query(
      `
      select
        t.typname as enum_name,
        e.enumlabel as enum_value,
        e.enumsortorder
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      order by t.typname, e.enumsortorder
      `,
    );

    const columnsByTable = new Map();
    for (const column of columnsResult.rows) {
      const list = columnsByTable.get(column.table_name) || [];
      list.push(column);
      columnsByTable.set(column.table_name, list);
    }

    const enumsByName = new Map();
    for (const row of enumsResult.rows) {
      const list = enumsByName.get(row.enum_name) || [];
      list.push(row.enum_value);
      enumsByName.set(row.enum_name, list);
    }

    const lines = [
      'export type Json =',
      '  | string',
      '  | number',
      '  | boolean',
      '  | null',
      '  | { [key: string]: Json | undefined }',
      '  | Json[]',
      '',
      'export type Database = {',
      '  public: {',
      '    Tables: {',
    ];

    for (const table of tablesResult.rows.map((row) => row.table_name)) {
      const columns = columnsByTable.get(table) || [];
      lines.push(`      ${JSON.stringify(table)}: {`);
      lines.push('        Row: {');
      for (const column of columns) {
        lines.push(propertyLine(column.column_name, false, withNull(pgTypeToTs(column), column.is_nullable)));
      }
      lines.push('        }');
      lines.push('        Insert: {');
      for (const column of columns) {
        const optional = column.is_nullable || column.has_default || column.is_identity;
        lines.push(propertyLine(column.column_name, optional, withNull(pgTypeToTs(column), column.is_nullable)));
      }
      lines.push('        }');
      lines.push('        Update: {');
      for (const column of columns) {
        lines.push(propertyLine(column.column_name, true, withNull(pgTypeToTs(column), column.is_nullable)));
      }
      lines.push('        }');
      lines.push('        Relationships: []');
      lines.push('      }');
    }

    lines.push('    }');
    lines.push('    Views: Record<string, never>');
    lines.push('    Functions: Record<string, never>');
    lines.push('    Enums: {');

    for (const [enumName, values] of enumsByName.entries()) {
      lines.push(`      ${JSON.stringify(enumName)}: ${values.map((value) => JSON.stringify(value)).join(' | ')}`);
    }

    lines.push('    }');
    lines.push('    CompositeTypes: Record<string, never>');
    lines.push('  }');
    lines.push('}');
    lines.push('');

    fs.writeFileSync(outFile, lines.join('\n'));
    console.log(`PASS generated ${path.relative(rootDir, outFile)}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
