# Deploy Runbook (GreenCheck Mobile)

## Scope
- Firebase (rules/indexes/functions)
- Expo/EAS mobile production build

## Required credentials
- firebase login
- eas login

## Pre-deploy
```bash
npm install
./scripts/predeploy_check.sh
```

## Firebase deploy
```bash
firebase use <project-id>
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only functions
```

## EAS production build
```bash
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```
