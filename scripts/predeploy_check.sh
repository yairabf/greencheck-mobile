#!/usr/bin/env bash
set -euo pipefail
npm run -s typecheck
npm run -s lint
npm run -s test
test -s docs/release/production-checklist.md
test -f firebase.json
test -f firebase/firestore.rules
test -f firebase/firestore.indexes.json
test -f eas.json
echo "Predeploy checks: OK"
