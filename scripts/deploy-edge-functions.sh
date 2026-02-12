#!/bin/bash
# Supabase Edge Functionsデプロイスクリプト
# 使用方法: ./scripts/deploy-edge-functions.sh [--project-ref <ref>]
set -euo pipefail

PROJECT_REF="${1:-}"

if [ -z "$PROJECT_REF" ]; then
  echo "Usage: ./scripts/deploy-edge-functions.sh <supabase-project-ref>"
  echo "Example: ./scripts/deploy-edge-functions.sh abcdefghijklmnop"
  exit 1
fi

FUNCTIONS=(
  "submit-report"
  "link-driver"
  "line-webhook"
  "morning-reminder"
  "check-submissions"
)

echo "=== ECXIA Edge Functions Deploy ==="
echo "Project: $PROJECT_REF"
echo "Functions: ${FUNCTIONS[*]}"
echo ""

for func in "${FUNCTIONS[@]}"; do
  echo "--- Deploying: $func ---"
  supabase functions deploy "$func" --project-ref "$PROJECT_REF" --no-verify-jwt
  echo "  Done."
done

echo ""
echo "=== All Edge Functions deployed successfully ==="
echo ""
echo "Next steps:"
echo "  1. Set secrets: supabase secrets set LINE_CHANNEL_ID=xxx LINE_CHANNEL_SECRET=xxx LINE_CHANNEL_ACCESS_TOKEN=xxx --project-ref $PROJECT_REF"
echo "  2. Set up Cron jobs in Supabase Dashboard:"
echo "     - morning-reminder: 0 23 * * * (UTC = JST 08:00)"
echo "     - check-submissions (pre_work): 0 0:30 * * * (UTC = JST 09:30)"
echo "     - check-submissions (post_work): 0 10 * * * (UTC = JST 19:00)"
echo "     - check-submissions (admin_summary): 0 1 * * * (UTC = JST 10:00)"
