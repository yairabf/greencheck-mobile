# Firestore Schema (v1)

## Collections

### `users/{uid}`
- `name: string`
- `phone: string`
- `teamIds: string[]`
- `createdAt: timestamp`
- `updatedAt: timestamp`

### `teams/{teamId}`
- `name: string`
- `createdBy: string (uid)`
- `memberIds: string[]`
- `activeIncidentId: string | null`
- `createdAt: timestamp`
- `updatedAt: timestamp`

### `teams/{teamId}/incidents/{incidentId}`
- `status: "active" | "closed"`
- `triggeredBy: string (uid)`
- `triggeredAt: timestamp`
- `endedBy: string (uid) | null`
- `endedAt: timestamp | null`
- `autoClosed: boolean`

### `teams/{teamId}/incidents/{incidentId}/responses/{uid}`
- `status: "green" | "not_green" | "no_response"`
- `respondedAt: timestamp | null`
- `updatedAt: timestamp`

## Constraints

- Only authenticated users access data.
- Team-scoped access enforced in rules via `memberIds`.
- Users can only update their own response documents.
- Deletion is disabled in v1 for audit simplicity.

## One active incident per team

Firestore rules cannot reliably enforce cross-document uniqueness in all race conditions.

Enforcement strategy (v1):
1. Use a transaction when triggering incident:
   - read `teams/{teamId}`
   - fail if `activeIncidentId != null`
   - create incident doc
   - set `activeIncidentId = incidentId`
2. On close:
   - transaction updates incident to `closed`
   - clears `activeIncidentId`


### `teamInvites/{code}`
- `teamId: string`
- `createdBy: string (uid)`
- `active: boolean`
- `createdAt: timestamp`
- `expiresAt: timestamp | null`


### `users/{uid}/devices/{deviceId}`
- `pushToken: string`
- `platform: "ios" | "android" | "web"`
- `active: boolean`
- `updatedAt: timestamp`


### `eventLogs/{logId}`
- `teamId: string`
- `incidentId: string | null`
- `type: string`
- `actor: string | null`
- `meta: object`
- `createdAt: timestamp`


### `pushDispatchRequests/{requestId}`
- `createdBy: string`
- `teamId: string`
- `incidentId: string`
- `type: string`
- `payload: object`
- `idempotencyKey: string`
- `status: queued|processed|failed|duplicate`
- `createdAt: timestamp`

### `pushDispatchIdempotency/{docId}`
- backend-only idempotency markers
