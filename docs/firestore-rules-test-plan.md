# Firestore Rules Test Plan (v1)

## Setup
1. Install Firebase CLI and login.
2. Initialize emulator config (if not already):
   - `firebase init emulators`
   - select Firestore
3. Start emulator:
   - `firebase emulators:start --only firestore`

## Test cases

### Auth gate
- Unauthenticated read on `/users/{uid}` -> **DENY**
- Unauthenticated read on `/teams/{teamId}` -> **DENY**

### User profile access
- Auth user reads own `/users/{uid}` -> **ALLOW**
- Auth user reads another user profile -> **DENY**

### Team membership access
- Team member reads `/teams/{teamId}` -> **ALLOW**
- Non-member reads `/teams/{teamId}` -> **DENY**

### Incident access
- Team member creates incident -> **ALLOW**
- Non-member creates incident -> **DENY**

### Response ownership
- User writes `/responses/{ownUid}` -> **ALLOW**
- User writes `/responses/{otherUid}` -> **DENY**

### Delete safety
- Any delete attempt on users/teams/incidents/responses -> **DENY**

## Notes
- Add automated tests with `@firebase/rules-unit-testing` in a later story.
