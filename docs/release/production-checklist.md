# Production Deployment Checklist

- [ ] Validate `.env` contract against `.env.example`
- [ ] Confirm Firebase Auth/Firestore config in target environment
- [ ] Run quality gates locally: `npm run typecheck && npm run lint && npm run test`
- [ ] Ensure GitHub Actions CI is green on `main`
- [ ] Deploy Firestore rules/indexes
- [ ] Run post-deploy smoke tests (auth, team create/join, trigger safety check, response flow)
- [ ] Verify rollback plan and owner
