# Integration/Invariant Test Plan

## Current scope
- Unit-level invariant checks for:
  - incident lifecycle race/idempotency semantics
  - invite idempotent join behavior
  - push queue payload contract

## Run
```bash
npm test
```

## Next step (recommended)
Add Firestore emulator-backed integration tests for transactional behavior:
- trigger concurrent incident creation attempts
- close races (manual/auto)
- stale pointer reconcile path
- queue rule validation with auth contexts
