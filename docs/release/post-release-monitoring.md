# Post-Release Monitoring

## First 24 hours
- Check event logs for:
  - trigger frequency
  - close outcomes (auto/manual)
  - reminder usage
  - push attempt summaries
- Watch for repeated INCIDENT_STALE / INCIDENT_NOT_ACTIVE patterns
- Validate no abnormal auth failure spikes

## First week
- Daily review of known issues and new reports
- Track manual QA feedback from beta users
- Re-prioritize backlog for top defects

## Alert thresholds (starter)
- Any critical bug in P0 flow => immediate hotfix triage
- Reproducible data consistency issue => rollout pause
