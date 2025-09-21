# Release & Rollback

## Automation Overview

- Pull requests automatically publish previews at `https://preview-taca-da-pinga.web.app`.
- Merges to `develop` auto-deploy to `https://develop-taca-da-pinga.web.app` after re-running lint/tests/build.
- Production deploys remain manual (below).

## Pre-merge to `production`

- [ ] CI green on `develop`
- [ ] Changelog entry if needed

## Deploy (human owner)

```bash
firebase use <prod-project-id>
yarn build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

> The service account used by the automation must have permission to deploy Hosting **and** Firestore rules (e.g. Firebase Hosting Admin + Firebase Rules Admin). Grant the same roles locally (or run deploys with an owner account) to avoid 403 errors.

## Rollback

- Revert merge commit (git revert -m 1 <sha>)

- Redeploy rules/hosting with the previous known-good commit
