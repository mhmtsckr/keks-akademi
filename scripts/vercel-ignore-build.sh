#!/usr/bin/env bash
set -u

# Vercel: exit 0 = skip build, exit 1 = continue build.
# Preview deployments are intentionally allowed so pull-request checks remain useful.
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "Vercel preview/non-production deployment: build allowed."
  exit 1
fi

APPROVED="$(sed -n 's/^CI-approved source: //p' deploy-trigger.txt 2>/dev/null | head -n 1)"
SUBJECT="$(git log -1 --pretty=%s 2>/dev/null || true)"
PARENT="$(git rev-parse HEAD^ 2>/dev/null || true)"

if printf '%s' "$SUBJECT" | grep -q '^ci: deploy approved ' \
  && [ -n "$APPROVED" ] \
  && [ "$PARENT" = "$APPROVED" ]; then
  echo "Vercel production deployment: GitHub CI approval verified."
  exit 1
fi

echo "Vercel production deployment skipped: commit is not CI-approved."
exit 0
