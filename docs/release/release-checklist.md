# Release Checklist

## 1) Pre-release sanity
- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [ ] QA matrix P0 tests passed (`docs/qa/qa-matrix.md`)
- [ ] Known issues reviewed (`docs/qa/known-issues.md`)

## 2) Configuration and security
- [ ] `.env` validated for target environment
- [x] Dependency audit gate passes (`npm audit --omit=dev` no High/Critical)
- [x] `EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false` (unless controlled test)
- [ ] Firebase Auth phone provider enabled
- [ ] Firestore rules/indexes up-to-date and deployed

## 3) Backend/infra checks
- [ ] OpenClaw health check green (if used in delivery path)
- [ ] Logging collections writable (`eventLogs`, `notificationLogs`)
- [ ] Storage/read permissions validated for user/team docs

## 4) Build and distribution
- [ ] Build version bumped
- [ ] Beta build generated (iOS/Android)
- [ ] Internal distribution notes prepared

## 5) Go/No-Go gate
- [ ] Product owner signoff
- [ ] Engineering signoff
- [ ] Rollback plan confirmed (`rollback-plan.md`)

## Release decision template
- Decision: GO / NO-GO
- Date/time:
- Build/version:
- Blocking issues:
- Approvers:
