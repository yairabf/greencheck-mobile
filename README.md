# GreenCheck Mobile

React Native (Expo + TypeScript) mobile app for team safety check-ins.

## Prerequisites
- Node 20+
- npm
- Expo Go app or emulator/simulator

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env
   ```
3. Fill Firebase values in `.env`.

## Run
- Start dev server:
  ```bash
  npm run start
  ```
- Android:
  ```bash
  npm run android
  ```
- iOS:
  ```bash
  npm run ios
  ```

## Quality
- Type check:
  ```bash
  npm run typecheck
  ```
- Lint:
  ```bash
  npm run lint
  ```
- Format:
  ```bash
  npm run format
  ```

## Project structure
- `src/navigation` - root and stack navigators
- `src/screens` - screen placeholders
- `src/config` - typed env config
- `src/components` - reusable UI components
- `src/services` - data/service integrations
- `src/types` - shared TS types

## Firebase setup
1. Create a Firebase project.
2. Enable Authentication (Phone provider) and Cloud Firestore.
3. Copy `.env.example` to `.env` and fill:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`

If env vars are missing, app still boots in dev and logs a warning.

## Firestore rules and indexes
- Rules file: `firebase/firestore.rules`
- Index file: `firebase/firestore.indexes.json`

### Deploy rules/indexes
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Local emulator (recommended before deploy)
```bash
firebase emulators:start --only firestore
```
See `docs/firestore-rules-test-plan.md` for the test checklist.

## CI
GitHub Actions runs quality checks on push/PR:
- `npm run typecheck`
- `npm run lint`

Workflow file: `.github/workflows/ci.yml`

## Phone OTP auth (Firebase)
This app uses Firebase Phone Auth + Expo Recaptcha modal.

Notes:
- Configure Firebase Phone provider in your Firebase console.
- In Expo Go/dev builds, recaptcha flow appears before OTP SMS is sent.
- Test phone numbers can be configured in Firebase Auth for development.

## Profile setup
After OTP sign-in, users complete profile setup (name required).

Stored at `users/{uid}`:
- `name`
- `phone`
- `teamIds` (initialized empty)
- `createdAt` / `updatedAt`

## Create team flow
Users can create a team from the app.

Creation writes (transaction):
1. `teams/{teamId}` is created with creator as first member.
2. `users/{uid}.teamIds` is updated with the new `teamId`.

## Team invites
Invite flow uses `teamInvites/{code}` documents.
- Creator generates an invite code.
- Joiner submits code.
- Join transaction updates both team membership and user `teamIds`.

## Trigger safety check
Home "Trigger Safety Check" now creates an active incident transactionally:
1. Verifies team has no active incident.
2. Creates `teams/{teamId}/incidents/{incidentId}` with `status=active`.
3. Sets `teams/{teamId}.activeIncidentId`.


### Response initialization
When a safety check is triggered, response docs are pre-created for all team members:
- path: `teams/{teamId}/incidents/{incidentId}/responses/{uid}`
- default: `status=no_response`, `respondedAt=null`, `updatedAt=timestamp`

### Response submission
Members can submit their own status for active incidents:
- `green` or `not_green`
- `respondedAt` is set only on first response
- `updatedAt` updates on every change (latest status wins)

### Real-time roster
Active incident responses are subscribed in real-time via Firestore listeners.
- Home dashboard updates roster status without manual refresh.
- Listener is unsubscribed automatically on context/screen change.

### Auto-close behavior
After each status submission, the app checks if all members responded.
If yes, incident is auto-closed transactionally:
- incident `status=closed`, `endedBy=system:auto`, `endedAt`, `autoClosed=true`
- team `activeIncidentId=null`

### Manual end-check
Any team member can manually end an active safety check.
Transactional close updates:
- incident: `status=closed`, `endedBy=<uid>`, `endedAt`, `autoClosed=false`
- team: `activeIncidentId=null`

### Single-active incident hardening
Incident lifecycle uses guard errors for race-safe behavior:
- `INCIDENT_ALREADY_ACTIVE`
- `INCIDENT_STALE`
- `INCIDENT_NOT_ACTIVE`

Home refresh reconciles invalid active pointers and clears stale references safely.

### Push token registration (MVP)
After auth + profile ready, app registers Expo push token and stores it at:
- `users/{uid}/devices/{deviceId}`

If permission is denied, app continues to work and shows non-blocking status.

### Push on incident trigger
When a safety check is started, app attempts team push fanout via Expo Push API:
- collects active device tokens from `users/{uid}/devices/*`
- sends payload with `teamId`, `incidentId`, `type=safety_check_started`
- failures are non-blocking (incident creation still succeeds)

### Reminder push (non-responders)
App can send reminder notifications only to members still `no_response` for the active incident.
Includes basic cooldown guard (2-minute bucket) via `notificationLogs` to reduce duplicates.

### Push on incident close
On manual or auto close, app attempts team close notification fanout (`type=safety_check_closed`).
- Includes `closedBy` and `autoClosed` in payload
- Non-blocking: close succeeds even if push fails
- Dedup guard prevents duplicate close sends per incident

### Notification open handling
Tapping push notifications is handled for background/cold start.
Payload (`type`, `teamId`, `incidentId`) is parsed safely and consumed once.
App routes to Home context and refreshes incident state.

### Push hardening flag (important)
Client-side push fanout is disabled by default for safety.
- `EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false` (default)
- Set to `true` only for controlled testing.

Production recommendation: move push sending to trusted backend (Cloud Functions/server),
and keep client push fanout disabled.

### Incident history
Teams can view incident history ordered by newest trigger time.
Each entry shows status, trigger time, end time, and close mode (auto/manual).

### Consistency guarantees (MVP)
- Single active incident per team.
- Active pointer reconciliation on dashboard refresh.
- Transactional close/update guards for stale/race-safe behavior.
- Atomic team membership updates during create/join flows.

See `docs/consistency-audit.md` for full invariant map and limits.

### Observability (beta)
Core lifecycle events are logged to `eventLogs` (non-blocking):
- incident trigger/close
- status submission
- reminder send
- push send summaries

A debug Metrics screen provides team-level counters for internal beta monitoring.

## QA docs
- Matrix: `docs/qa/qa-matrix.md`
- Latest run: `docs/qa/qa-run-2026-03-09.md`
- Known issues: `docs/qa/known-issues.md`

## Release docs
- Checklist: `docs/release/release-checklist.md`
- Rollout: `docs/release/rollout-playbook.md`
- Rollback: `docs/release/rollback-plan.md`
- Monitoring: `docs/release/post-release-monitoring.md`

### Backend push dispatch scaffold
Client now queues push jobs to Firestore (`pushDispatchRequests`) and does not send Expo pushes directly.
A Firebase Function (`functions/index.js`) processes queued requests server-side with idempotency guards.

### Push queue security hardening
`pushDispatchRequests` is now restricted by rules:
- creator must be authenticated and a member of `teamId`
- `createdBy` must match auth uid
- clients cannot set backend-only fields (`status`, `result`, `processedAt`)
- request reads are creator-scoped

## Security docs
- Dependency risk log: `docs/security/dependency-risk-log.md`


## Repository
- GitHub: https://github.com/yairabf/greencheck-mobile
- Tracking issue: https://github.com/yairabf/greencheck-mobile/issues/1
- Production checklist: `docs/release/production-checklist.md`
