#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/sponsorbridge}"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.production.yml"
APP_ENV_FILE="${PROJECT_DIR}/ops/.env.production"
BACKUP_ENV_FILE="${PROJECT_DIR}/ops/.env.backup"

if [[ ! -f "$APP_ENV_FILE" || ! -f "$BACKUP_ENV_FILE" ]]; then
  echo "Missing production or backup environment file." >&2
  exit 1
fi

set -a
source "$APP_ENV_FILE"
source "$BACKUP_ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${BACKUP_DIR}/sponsorbridge-${timestamp}.sql.gz"

docker compose --env-file "$APP_ENV_FILE" -f "$COMPOSE_FILE" exec -T db \
  mysqldump --single-transaction --routines --events --triggers \
  -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" | gzip -9 > "$backup_file"

gzip -t "$backup_file"
find "$BACKUP_DIR" -type f -name 'sponsorbridge-*.sql.gz' -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete

if [[ -n "${BACKUP_S3_URI:-}" ]]; then
  command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required for offsite backup copy." >&2; exit 1; }
  aws s3 cp "$backup_file" "${BACKUP_S3_URI%/}/$(basename "$backup_file")" --only-show-errors
fi

echo "Database backup completed: $(basename "$backup_file")"
