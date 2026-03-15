# GreenCheck Mobile — Project Documentation Index

Generated: 2026-03-11 UTC
Mode: initial_scan

## 1) Project Overview
- Team safety check-in mobile app
- Stack: React Native (Expo 55), TypeScript, Firebase Auth/Firestore/Functions
- Core workflows: check-ins, incident lifecycle, team roster, push notifications

## 2) Architecture Snapshot
- App layer: `src/screens`, `src/navigation`, `src/components`
- Domain/services: `src/services`
- Backend logic: `functions/` (Firebase Cloud Functions)
- Data/auth: Firestore + Firebase Auth phone OTP

## 3) Quality & Testing Artifacts
- Unit tests: `tests/unit`
- QA and release docs: `docs/qa`, `docs/release`, `docs/testing`

## 4) Key Risks / Watchpoints
- Auth/OTP reliability across environments
- Push notification token lifecycle and retries
- Incident state transitions consistency
- Firestore rules and security policy drift

## 5) Recommended Next Docs
1. Service contract map (`src/services/*` ↔ cloud functions)
2. Incident lifecycle state machine spec
3. Firestore schema + rules matrix (runtime validation)
4. Release runbook (build, env, smoke tests)