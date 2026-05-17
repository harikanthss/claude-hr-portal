#!/bin/bash
# Grevya Automated Backup — Add to crontab: 0 2 * * * /path/to/scripts/backup.sh
set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
DB_PATH="$ROOT_DIR/backend/data/grevya.db"
MAX_BACKUPS=30
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="grevya_backup_$DATE"
mkdir -p "$BACKUP_DIR"
echo "[$(date)] Starting Grevya backup..."
# SQLite
if [ -f "$DB_PATH" ]; then
    sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/${BACKUP_NAME}.db'" && gzip "$BACKUP_DIR/${BACKUP_NAME}.db"
    echo "✅ SQLite backed up"
fi
# PostgreSQL
if [ -n "$DATABASE_URL" ]; then
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/${BACKUP_NAME}_pg.sql.gz" && echo "✅ PostgreSQL backed up"
fi
# Uploads
if [ -d "$ROOT_DIR/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C "$ROOT_DIR/backend" uploads/ 2>/dev/null || true
    echo "✅ Uploads backed up"
fi
# Cleanup
ls -t "$BACKUP_DIR"/grevya_backup_*.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm --
# Optional S3
if [ -n "$S3_BUCKET" ] && command -v aws &>/dev/null; then
    aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/grevya-backups/" --quiet && echo "✅ Synced to S3"
fi
echo "[$(date)] ✅ Backup complete → $BACKUP_DIR"
