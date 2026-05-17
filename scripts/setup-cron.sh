#!/bin/bash
# Run once on server to enable daily 2 AM backups
SCRIPT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backup.sh"
chmod +x "$SCRIPT"
(crontab -l 2>/dev/null | grep -v backup; echo "0 2 * * * $SCRIPT >> /var/log/grevya-backup.log 2>&1") | crontab -
echo "✅ Cron job set: daily backup at 2 AM"
