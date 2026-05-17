#!/bin/bash
# Restore from backup: ./restore.sh backups/grevya_backup_2024-01-01_02-00-00.db.gz
BACKUP_FILE="$1"
DB_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backend/data/grevya.db"
if [ -z "$BACKUP_FILE" ]; then echo "Usage: ./restore.sh <backup.db.gz>"; exit 1; fi
echo "⚠️  This will overwrite your current database. Press Ctrl+C to cancel."
sleep 5
cp "$DB_PATH" "${DB_PATH}.before-restore-$(date +%Y%m%d)" 2>/dev/null || true
gunzip -c "$BACKUP_FILE" > "$DB_PATH" && echo "✅ Database restored from $BACKUP_FILE"
