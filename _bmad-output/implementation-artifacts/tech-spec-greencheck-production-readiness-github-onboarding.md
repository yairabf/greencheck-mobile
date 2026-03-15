---
title: GreenCheck Production Readiness + GitHub Onboarding
slug: greencheck-production-readiness-github-onboarding
created: 2026-03-11 00:39 UTC
status: ready-for-dev
stepsCompleted:
- 1
- 2
- 3
- 4
tech_stack:
- Expo ~55.0.5
- React 19.2.0
- React Native 0.83.2
- TypeScript strict
- Firebase Auth/Firestore/Functions
- GitHub Actions CI
files_to_modify:
- .github/workflows/ci.yml
- README.md
- docs/index.md
- _bmad-output/project-context.md
code_patterns:
- service-layer business logic
- TypeScript strict mode
- Firebase transaction invariants
- CI gate before merge
test_patterns:
- npm run typecheck
- npm run lint
- npm run test
- workflow checks in .github/workflows/ci.yml
---



# Tech-Spec: GreenCheck Production Readiness + GitHub Onboarding

**Created:** 2026-03-11 00:39 UTC

## Overview

### Problem Statement
GreenCheck needs a production-ready delivery flow. The project currently lacks a canonical GitHub-origin workflow as the first step toward reliable production deployments.

### Solution
Create and configure a public GitHub repository (`greencheck-mobile`), push the current codebase to `main`, validate CI, and bootstrap production-readiness tracking.

### Scope

**In Scope:**
- Create public GitHub repo
- Connect local git remote and push `main`
- Verify CI workflow executes successfully
- Create production-readiness tracking issue

**Out of Scope:**
- Large feature refactors
- Infra re-architecture
- Full production deployment execution (handled in follow-up steps)

## Context for Development

### Codebase Patterns
- Business logic is service-oriented; avoid pushing lifecycle logic into UI handlers.
- TypeScript strictness is non-negotiable and should remain enforced.
- Incident/team lifecycle relies on transaction-safe Firebase patterns.
- CI quality gate (typecheck/lint/tests) is the merge baseline.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `.github/workflows/ci.yml` | CI quality gate and branch enforcement baseline |
| `README.md` | setup/run and operator guidance |
| `_bmad-output/project-context.md` | project-specific AI implementation constraints |
| `docs/index.md` | generated documentation baseline |

### Technical Decisions
- Repository target: `greencheck-mobile` (public), default branch `main`.
- GitHub becomes source-of-truth before production deployment work.
- Create a production-readiness tracking issue immediately after repo push.

## Implementation Plan

### Tasks
- [x] Task 1: Create and configure public GitHub repository
  - File: `N/A (GitHub org/user settings + gh cli)`
  - Action: Create `greencheck-mobile` as a public repository under target owner.
  - Notes: Set default branch to `main`; ensure correct repo description/topics.

- [x] Task 2: Connect local repository and push source-of-truth branch
  - File: `.git/config`
  - Action: Add `origin` remote to new GitHub repo and push local `main` with upstream tracking.
  - Notes: Verify no sensitive files are tracked before first public push.

- [x] Task 3: Validate CI pipeline on GitHub Actions
  - File: `.github/workflows/ci.yml`
  - Action: Ensure workflow runs on push/PR and succeeds (`typecheck`, `lint`, `test`).
  - Notes: If failures occur, patch scripts/config minimally and rerun until green.

- [x] Task 4: Add production readiness tracking issue
  - File: `N/A (GitHub issue)`
  - Action: Create issue "Production Readiness Checklist" with checklist covering env, auth, data safety, release validation, rollback plan.
  - Notes: Pin/link issue in README or project board for visibility.

- [x] Task 5: Tighten repository baseline docs for external/public consumption
  - File: `README.md`
  - Action: Add clear setup, environment requirements, CI status intent, and contribution/release notes.
  - Notes: Keep secrets out; point to `.env.example` only.

- [x] Task 6: Prepare deploy handoff checklist (next phase)
  - File: `docs/index.md` (or `docs/release/production-checklist.md`)
  - Action: Add deployment prerequisites and smoke-test criteria for production rollout.
  - Notes: Deployment execution is next slice, not in this first GitHub onboarding slice.

### Acceptance Criteria
- [ ] AC 1: Given a local GreenCheck repository, when GitHub repo creation is executed, then a public repo named `greencheck-mobile` exists and is accessible.
- [ ] AC 2: Given the new remote exists, when `main` is pushed, then GitHub shows full code history and files on `main`.
- [ ] AC 3: Given CI workflow config is present, when push triggers GitHub Actions, then typecheck/lint/test jobs complete successfully (or documented fixes are applied and rerun to green).
- [ ] AC 4: Given repo onboarding is complete, when the tracking issue is created, then "Production Readiness Checklist" exists with actionable checklist items.
- [ ] AC 5: Given README updates are applied, when a new contributor opens the repo, then setup/run/quality steps are discoverable without hidden assumptions.

## Additional Context

### Dependencies
- GitHub account with permissions to create public repositories
- GitHub CLI authenticated (`gh auth status`)
- Existing local git history in `greencheck-mobile`
- Firebase credentials remain external to repo (`.env` not committed)

### Testing Strategy
- Automated: run `npm run typecheck`, `npm run lint`, `npm run test` locally and via GitHub Actions.
- Integration: verify workflow triggers on push and PR.
- Manual: clone fresh and run setup checklist from README.

### Notes
- Public repo creation requires explicit secret hygiene pass before first push.
- Keep production deployment tasks as follow-up flow after GitHub baseline is stable.
- High-risk area: accidental credential exposure in commit history or docs.


Step 4 confirmation: spec reviewed and accepted by user (Continue selected). Status target: ready-for-dev. Final file path retained for quick-dev handoff.

## Review Notes
- Adversarial review completed
- Findings: 3 total, 3 fixed, 0 skipped
- Resolution approach: walk-through
