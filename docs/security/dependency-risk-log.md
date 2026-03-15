# Dependency Risk Log

## Date
2026-03-09

## Scope
Phone auth / recaptcha dependency chain security hardening.

## Baseline
- `npm audit --omit=dev` reported 7 vulnerabilities (5 high, 2 moderate)
- Primary source: `expo-firebase-recaptcha@2.3.1` transitive chain (`expo-firebase-core`, old config plugin deps)

## Change applied
- Replaced dependency version:
  - from `expo-firebase-recaptcha@2.3.1`
  - to `expo-firebase-recaptcha@1.4.4`

## Validation after change
- `npm run typecheck` ✅
- `npm run lint` ✅
- `npm test` ✅ (3/3 suites)
- `npm audit --omit=dev` ✅ 0 vulnerabilities

## Residual risk
- No known prod dependency vulnerabilities from audit at this time.
- Continue monitoring dependency advisories on each release cycle.

## Decision
- Security gate for dependency chain: **PASS**
- Accepted for beta and production candidate builds, pending routine re-audit.
