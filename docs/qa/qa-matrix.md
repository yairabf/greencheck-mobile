# QA Matrix

## Go / No-Go Criteria

**Go (Beta):**
- No open Critical issues
- All P0 flows pass
- Security defaults verified (`EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false` unless controlled test)

**No-Go:**
- Auth/profile broken
- Incident lifecycle broken (trigger/respond/close)
- Data consistency violations (multiple active incidents / stale pointer unreconciled)

---

## Test Cases

| ID | Area | Preconditions | Steps | Expected | Actual | Status |
|---|---|---|---|---|---|---|
| QA-AUTH-01 | OTP auth success | Firebase phone auth enabled | Enter valid phone, request OTP, verify code | User signed in | Pending | Pending |
| QA-AUTH-02 | OTP invalid code | Auth screen open | Enter wrong code | Friendly error shown, no crash | Pending | Pending |
| QA-PROF-01 | Profile gate | First-time signed-in user | Complete profile with valid name | Profile saved, app enters dashboard | Pending | Pending |
| QA-PROF-02 | Profile validation | Profile setup screen | Enter short name (<2) | Validation error shown | Pending | Pending |
| QA-TEAM-01 | Create team | Auth+profile complete | Create team | Team created, user in memberIds/teamIds | Pending | Pending |
| QA-TEAM-02 | Join team invite | Valid invite exists | Join via invite code | User added to team memberIds/teamIds | Pending | Pending |
| QA-TEAM-03 | Invalid invite | Any auth user | Enter random code | Friendly invalid code error | Pending | Pending |
| QA-INC-01 | Trigger incident | Team exists, no active incident | Tap trigger | Active incident created, pointer set | Pending | Pending |
| QA-INC-02 | Double trigger guard | Active incident exists | Tap trigger again | Blocked with active-incident message | Pending | Pending |
| QA-INC-03 | Submit Green | Active incident exists | Tap I'm Green | Own response set green, counts update | Pending | Pending |
| QA-INC-04 | Submit Not Green | Active incident exists | Tap Not Green | Own response set not_green, counts update | Pending | Pending |
| QA-INC-05 | Auto-close | Multi-member incident | All members respond | Incident auto-closes, pointer cleared | Pending | Pending |
| QA-INC-06 | Manual close | Active incident exists | Tap End Safety Check | Incident closed manually, pointer cleared | Pending | Pending |
| QA-REM-01 | Reminder targets no_response | Active incident with non-responders | Tap Send Reminder | Reminder attempts only non-responders | Pending | Pending |
| QA-REM-02 | Reminder cooldown | Reminder just sent | Send reminder again quickly | Cooldown message / no duplicate burst | Pending | Pending |
| QA-NOTIF-01 | Notification tap handling | Push payload received | Tap notification in bg | App opens and focuses incident context | Pending | Pending |
| QA-NOTIF-02 | Cold start notification | App closed, push tapped | Launch app from push | Intent consumed once, no loop | Pending | Pending |
| QA-HIST-01 | Incident history list | Team has past incidents | Open Incident History | Newest-first list with details | Pending | Pending |
| QA-MET-01 | Metrics view | Event logs available | Open Metrics | Counters shown without crash | Pending | Pending |
| QA-CONS-01 | Reconcile stale pointer | Inject stale activeIncidentId | Refresh Home | Pointer self-heals/clears | Pending | Pending |
| QA-SEC-01 | Push hardening default | Fresh env | Check flag value | Client push disabled by default | Pending | Pending |

---

## Edge / Race Scenarios

- Simultaneous trigger attempts by 2 users
- Submit status while incident closes (manual/auto)
- Reminder during close race
- Invite join repeated by same user (idempotent)

