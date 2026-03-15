# GreenCheck Firebase Functions (Push Dispatch)

This scaffold processes Firestore `pushDispatchRequests/*` docs and sends Expo push messages server-side.

## Deploy (example)
- `firebase init functions`
- copy this folder into your firebase functions workspace
- `firebase deploy --only functions`

## Request schema (`pushDispatchRequests/{id}`)
- `teamId` (string)
- `incidentId` (string)
- `type` (`safety_check_started|safety_check_reminder|safety_check_closed`)
- `payload` (object)
- `idempotencyKey` (string)
- `createdBy` (uid string)
- `createdAt` (timestamp)

Function writes status/result back to the same request doc.

Function verifies `createdBy` is a current member of `teamId` before processing.
