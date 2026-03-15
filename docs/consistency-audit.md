# Consistency Audit (S5.3)

## Core invariants

1. **Single active incident per team**
   - Enforced in `triggerSafetyCheck()` transaction.
   - Guard: `teams/{teamId}.activeIncidentId` must be null.

2. **Active pointer must reference active incident**
   - Enforced by runtime reconcile: `reconcileActiveIncidentPointer()`.
   - Clears stale/missing/non-active pointers.

3. **Incident close is pointer-safe**
   - `endSafetyCheck()` and `autoCloseIfComplete()` both require:
     - incident status is `active`
     - `team.activeIncidentId == incidentId`

4. **Status updates must target active incident**
   - `submitMyStatus()` validates team active pointer first.

5. **Team membership updates are atomic**
   - Team creation and join invite are transaction-based:
     - Team member list + user `teamIds` updated together.

6. **Reminder/close notifications deduplicated**
   - `notificationLogs` keys used as coarse dedup guard.

## Known limits (acceptable for MVP)

- Push fanout currently client-gated with feature flag and is disabled by default.
- Reminder dedup uses time-bucket heuristic, not strict exactly-once semantics.

## Recovery strategy

- Run `reconcileActiveIncidentPointer(teamId)` whenever dashboard refreshes.
- Treat stale operations as user-safe no-op with clear message.
