# Rollout Playbook

## Stage 1 — Internal beta
- Audience: core team only
- Duration: 24-48h
- Focus:
  - auth/profile
  - create/join team
  - trigger/respond/close flows
  - history and metrics screens
- Exit criteria:
  - no critical defects
  - P0 path stable

## Stage 2 — Wider beta
- Audience: selected external testers
- Duration: 3-7 days
- Focus:
  - real-world notification behavior
  - edge-case races
  - onboarding clarity
- Exit criteria:
  - no unresolved high severity issues
  - acceptable crash/error rate

## Stage 3 — Production launch
- Preconditions:
  - backend push sender implemented (recommended)
  - security dependency review complete
  - support/runbook ready
- Launch day steps:
  1. Confirm checklist complete
  2. Release build
  3. Monitor first-hour metrics/logs
  4. Share status update
