---
project: GreenCheck Mobile
generated_at_utc: 2026-03-11T00:06:00Z
workflow: generate-project-context
mode: discovery
sections_completed:
  - step-01-discovery
---

# Step 1 — Context Discovery Summary

## Existing Context Check
- Existing `project-context.md` files: **none found**.
- Existing docs baseline found:
  - `docs/index.md`
  - `docs/project-scan-report.json`

## Technology Stack Discovered
- **App Framework:** Expo `~55.0.5`
- **UI Runtime:** React `19.2.0`, React Native `0.83.2`
- **Language:** TypeScript `~5.9.2` (`strict: true`)
- **Navigation:** `@react-navigation/native` `^7.1.33`, native-stack `^7.14.4`
- **Backend Platform:** Firebase `^12.10.0` + Cloud Functions
- **Notifications:** `expo-notifications` `^55.0.11`
- **Tooling:** ESLint `^10.0.3`, Prettier `^3.8.1`, Jest `^30.2.0`, ts-jest `^29.4.6`

## Existing Patterns Found
- **Code organization:** `src/screens`, `src/navigation`, `src/components`, `src/services`, `src/types`, `src/config`
- **Service-driven app logic** under `src/services/*`
- **Firebase-first flows:** Phone OTP auth, Firestore transactions, incident lifecycle
- **Quality scripts:** `typecheck`, `lint`, `format`, `test`
- **CI checks:** Typecheck + lint on push/PR

## Critical Rules for AI Agents (initial extraction)
1. Keep TypeScript strict compatibility (no `any` shortcuts).
2. Follow existing `src/services` organization and avoid business logic in screens.
3. Preserve incident lifecycle invariants (`active`/`closed`, single active incident per team).
4. Treat push fanout as non-blocking and keep `EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false` by default unless explicitly testing.
5. Respect Firestore transaction boundaries for team/incidents/member updates.

## Key Areas for Context Rules in Step 2
- TypeScript + lint/test constraints
- Firebase auth/data integrity patterns
- Service contract boundaries (`services` ↔ screens)
- Notification and incident-state safety rules
- CI/release guardrails


## Technology Stack & Versions

- Expo `~55.0.5`
- React `19.2.0`
- React Native `0.83.2`
- TypeScript `~5.9.2` (`strict: true`)
- Firebase `^12.10.0`
- `@react-navigation/native` `^7.1.33`
- `@react-navigation/native-stack` `^7.14.4`
- `expo-notifications` `^55.0.11`
- ESLint `^10.0.3`, Prettier `^3.8.1`, Jest `^30.2.0`, ts-jest `^29.4.6`

### Version/compatibility constraints
- Keep Expo SDK and React Native compatibility aligned; avoid independent major bumps.
- Keep TypeScript strict mode enabled (do not relax for convenience).
- Avoid non-Expo-native package additions without explicit approval.


## Critical Implementation Rules

### Language-Specific Rules
- Keep TypeScript strictness intact; no relaxing compiler checks.
- Avoid `any`; use explicit domain models from `src/types/*`.
- Keep service contracts typed and exported from `src/services/*`.
- Guard nullable Firebase data before rendering or state transitions.
- Use explicit async error branches; no silent catch blocks.

### Framework-Specific Rules
- Keep business/lifecycle logic in services, not screens.
- Preserve navigation conventions in `src/navigation/*`.
- Respect Expo managed workflow compatibility when adding packages.
- Keep push fanout non-blocking and idempotent.
- Default `EXPO_PUBLIC_ENABLE_CLIENT_PUSH=false`; only enable in controlled testing.

### Testing Rules
- Keep unit/integration boundaries clear and deterministic.
- Validate incident invariants: single active incident per team; valid state transitions.
- Mock minimally; do not hide Firestore transaction behavior behind over-mocking.
- Pre-merge baseline: `npm run typecheck`, `npm run lint`, `npm run test`.

### Code Quality & Style Rules
- Enforce ESLint + Prettier; no bypasses.
- Keep structure boundaries consistent (`screens`, `services`, `components`, `types`, `config`).
- Use explicit domain naming for incident/team/response paths and objects.
- Update docs when service contracts or lifecycle semantics change.

### Development Workflow Rules
- Keep CI green on typecheck/lint before merge.
- Use focused commits per behavior change.
- Keep env contract aligned with `.env.example` and README docs.
- Validate and deploy Firestore rules/indexes with explicit checks.

### Critical Don’t-Miss Rules
- Do not break transactional integrity around incident lifecycle.
- Do not move core state transitions into UI handlers.
- Do not make push delivery a hard dependency for incident correctness.
- Do not desync Expo/React Native compatibility with ad-hoc upgrades.
- Do not ship auth/team-membership flow changes without edge-case validation.

---

## Usage Guidelines

**For AI Agents**
- Read this file before implementing code.
- Prefer restrictive/safe options when uncertain.
- Preserve service-layer boundaries and transaction invariants.
- Update this file when introducing new stable patterns.

**For Humans**
- Keep this file lean and focused on non-obvious rules.
- Update on stack/config/architecture changes.
- Review periodically and remove stale rules.

Last Updated: 2026-03-11 (UTC)

Status: complete
Optimized for LLM: true