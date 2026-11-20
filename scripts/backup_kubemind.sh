#!/usr/bin/env bash
# ==============================================================================
# KubeMind Fail-Safe PostgreSQL Backup Script
# Usage: ./scripts/backup_kubemind.sh
# Optional Env: S3_BACKUP_BUCKET (for off-instance cloud archive)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DUMP_FILE="$BACKUP_DIR/kubemind_$TIMESTAMP.dump"
mkdir -p "$BACKUP_DIR"

echo "[INFO] Starting KubeMind PostgreSQL backup at $(date -u)..."

# 1. Fetch database configuration and credentials from Kubernetes
if ! kubectl get namespace kubemind >/dev/null 2>&1; then
  echo "[ERROR] Kubernetes namespace 'kubemind' does not exist!" >&2
  exit 1
fi

POSTGRES_USER=$(kubectl get secret kubemind-secrets -n kubemind -o jsonpath='{.data.POSTGRES_USER}' | base64 -d)
POSTGRES_DB=$(kubectl get configmap kubemind-config -n kubemind -o jsonpath='{.data.POSTGRES_DB}')

if [[ -z "$POSTGRES_USER" || -z "$POSTGRES_DB" ]]; then
  echo "[ERROR] Failed to retrieve POSTGRES_USER or POSTGRES_DB from cluster secrets/configmap!" >&2
  exit 1
fi

# 2. Locate active PostgreSQL pod
POSTGRES_POD=$(kubectl get pods -n kubemind -l app.kubernetes.io/name=postgres --field-selector=status.phase=Running -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || true)
if [[ -z "$POSTGRES_POD" ]]; then
  echo "[ERROR] No running postgres pod found in namespace 'kubemind'!" >&2
  exit 1
fi

echo "[INFO] Dumping database '$POSTGRES_DB' as user '$POSTGRES_USER' from pod '$POSTGRES_POD'..."
# Trap failure: if pg_dump fails, remove partial file and exit nonzero
if ! kubectl exec -n kubemind "$POSTGRES_POD" -- pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c > "$DUMP_FILE"; then
  echo "[ERROR] pg_dump failed inside pod '$POSTGRES_POD'!" >&2
  rm -f "$DUMP_FILE"
  exit 1
fi

# 3. Verify dump integrity via Table of Contents (TOC) inspection
echo "[INFO] Verifying archive integrity..."
if ! TOC_COUNT=$(pg_restore -l "$DUMP_FILE" 2>/dev/null | grep -c "TABLE DATA" || true); then
  echo "[ERROR] Backup integrity check failed: Unable to parse pg_restore table of contents!" >&2
  rm -f "$DUMP_FILE"
  exit 1
fi

DUMP_SIZE=$(stat -c%s "$DUMP_FILE" 2>/dev/null || wc -c < "$DUMP_FILE")
if [[ "$DUMP_SIZE" -lt 5000 || "$TOC_COUNT" -lt 5 ]]; then
  echo "[ERROR] Backup integrity check failed: Archive ($DUMP_SIZE bytes, $TOC_COUNT tables) is incomplete or corrupted!" >&2
  rm -f "$DUMP_FILE"
  exit 1
fi

echo "[SUCCESS] Dump verified: $DUMP_SIZE bytes, containing $TOC_COUNT table data sections."

# 4. Off-Instance Shipping to AWS S3 (Fails safely on upload errors)
if [[ -n "${S3_BACKUP_BUCKET:-}" ]]; then
  echo "[INFO] Shipping backup off-instance to s3://$S3_BACKUP_BUCKET/backups/..."
  if ! command -v aws >/dev/null 2>&1; then
    echo "[ERROR] 'aws' CLI not installed on host, but S3_BACKUP_BUCKET is configured!" >&2
    exit 1
  fi

  if ! aws s3 cp "$DUMP_FILE" "s3://$S3_BACKUP_BUCKET/backups/kubemind_$TIMESTAMP.dump"; then
    echo "[ERROR] AWS S3 upload failed for s3://$S3_BACKUP_BUCKET/backups/kubemind_$TIMESTAMP.dump!" >&2
    exit 1
  fi
  echo "[SUCCESS] Off-instance cloud archive complete."
fi

# 5. Local Retention: Prune backups older than 7 days
echo "[INFO] Pruning local backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "kubemind_*.dump" -mtime +7 -delete

echo "[SUCCESS] Backup process completed successfully at $(date -u)."
