#!/usr/bin/env bash
set -euo pipefail
# Restore into an isolated empty database first; requires pg_restore and gpg.
: "${RESTORE_DATABASE_URL:?Set an isolated target database URL}"
: "${BACKUP_PASSPHRASE:?Set the backup decryption passphrase}"
archive="${1:?Usage: scripts/restore-encrypted-backup.sh archive.dump.gpg}"
gpg --batch --decrypt --pinentry-mode loopback --passphrase-fd 3 "$archive" 3<<<"$BACKUP_PASSPHRASE" | pg_restore --no-owner --no-acl --exit-on-error --dbname="$RESTORE_DATABASE_URL"
