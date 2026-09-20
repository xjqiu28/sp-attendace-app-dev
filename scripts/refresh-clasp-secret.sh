#!/usr/bin/env bash
set -euo pipefail

# Re-authenticates clasp and pushes the fresh credentials straight into
# the CLASPRC_JSON GitHub Actions secret that deploy-gas.yml uses.
#
# When you need this: clasp push failing in CI with
# "Error retrieving access token: Error: invalid_grant" means the
# stored OAuth token expired or was revoked. If you're still using
# clasp's shared default OAuth client, this happens on a strict 7-day
# cycle — see the "Apps Script deploy authentication" section of the
# README for the one-time fix (your own OAuth client) that makes this
# rare instead of weekly.
#
# Usage:
#   ./scripts/refresh-clasp-secret.sh
#   CLASP_CREDS_PATH=~/path/to/credentials.json ./scripts/refresh-clasp-secret.sh

if ! command -v gh &> /dev/null; then
  echo "GitHub CLI (gh) is required. Install it, then run 'gh auth login', and try again." >&2
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo "Not logged into gh. Run 'gh auth login' first." >&2
  exit 1
fi

# clasp saves credentials to a project-local .clasprc.json when --creds
# is used, but to the global ~/.clasprc.json otherwise — read back
# whichever one it actually wrote, not always the global one.
creds_args=()
clasprc_path=~/.clasprc.json
if [ -n "${CLASP_CREDS_PATH:-}" ]; then
  creds_args=(--creds "$CLASP_CREDS_PATH")
  clasprc_path="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.clasprc.json"
fi

npx clasp login "${creds_args[@]}"

# The workflow always places this content at the GLOBAL ~/.clasprc.json
# path in CI, regardless of where clasp wrote it here. A file clasp
# wrote in --creds ("local") mode carries isLocalCreds:true, and clasp
# rejects that combination — local-shaped content at the global path —
# outright, failing with "No access, refresh token, API key or refresh
# handler callback is set." even though the token itself is valid.
# Normalize it before uploading so this always works either way.
python3 -c "
import json
with open('$clasprc_path') as f:
    data = json.load(f)
data['isLocalCreds'] = False
with open('$clasprc_path', 'w') as f:
    json.dump(data, f)
"

base64 -i "$clasprc_path" | gh secret set CLASPRC_JSON

echo "CLASPRC_JSON secret updated. Re-run the failed 'Deploy Apps Script' workflow to confirm."
