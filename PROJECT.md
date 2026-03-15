# PROJECT.md - GreenCheck Mobile

React Native (Expo) team safety check-in app.

## Project Overview

**Description:** Mobile app for team safety check-ins with phone OTP authentication, incident lifecycle management, push notifications, and team roster tracking.

**Tech Stack:**
- React Native / Expo SDK 55
- TypeScript (strict mode)
- Firebase (Auth with phone OTP, Firestore, Cloud Functions)
- React 19.2, React Native 0.83

**Repository:** Not a git repo (migrated from sandbox)

## Current Status

**Phase:** Implementation (paused on 2026-03-09)
**Lane:** `DEV:greencheck`

Last known state: Development was active, comprehensive README and docs exist, testing artifacts present (qa-matrix, known-issues, integration-plan).

## Key Decisions & Context

- Using Firebase phone OTP for authentication (no email/password)
- Cloud Functions handle backend logic (push notifications, incident state)
- Incident lifecycle: created → acknowledged → resolved
- Team roster tracked in Firestore
- Push notifications managed via Expo push service
- Comprehensive QA documentation under `docs/qa/`

## Project Structure

```
src/
  screens/       - HomeScreen, AuthScreen, IncidentScreen, TeamScreen, MetricsScreen
  navigation/    - RootNavigator, AppStack
  services/      - incident, notify, invite, team, push, observability, errors
  components/    - EmptyState, LoadingBlock, AppBanner, IncidentRoster
  config/        - env.ts
  types/         - incident.ts
functions/       - Firebase Cloud Functions
tests/unit/      - incident-invariants, push-queue-contract, invite-idempotency
docs/            - qa/, release/, security/, testing/, firestore-schema
```

## Development Commands

```bash
npm run start          # start dev server
npm run android        # run on Android
npm run ios            # run on iOS
npm run typecheck      # type check
npm run lint           # lint
npm run format         # format
```

## BMad State

If BMad was initialized (check for `_bmad/` directory), track phase here.
Current: Implementation phase (based on docs/release artifacts presence)

## What the Agent Was Last Doing

Development work on the mobile app. The project appears feature-complete with extensive documentation and testing artifacts. Next steps would likely be deployment or continued refinement based on QA findings.

## Memory

For project-specific daily logs, create `memory/` directory here if needed.
