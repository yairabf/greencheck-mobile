# Rollback Plan

## Fast rollback levers
1. Disable risky features by config:
   - keep `EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false`
2. Revert to previous known-good app build in distribution channel.
3. If needed, restrict writes via Firestore rules emergency patch.

## Trigger conditions for rollback
- Critical auth/incident lifecycle failure
- Data consistency corruption risk
- Severe crash loop or unusable UX

## Rollback procedure
1. Declare incident and stop rollout.
2. Apply config safety toggles.
3. Revert app build.
4. Confirm core flow health.
5. Publish incident summary + next actions.

## Post-rollback
- Root cause analysis
- Corrective fix
- Re-validate via QA matrix before re-release
