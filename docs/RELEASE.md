# Release & Rollback

## Automation Overview

- Pull requests automatically publish previews at `https://preview-taca-da-pinga.web.app`.
- Merges to `develop` auto-deploy to `https://develop-taca-da-pinga.web.app` after re-running lint/tests/build.
- Production deploys remain manual (below).

## Pre-merge to `production`

- [ ] The `develop` → `production` PR is current and mergeable.
- [ ] **CI / Lint / Typecheck / Test / Build** is green for the PR head.
- [ ] The PR preview or `develop` deployment has been visually checked on desktop and mobile.
- [ ] Firestore rules and indexes are included when their source files changed.
- [ ] Required approval is recorded (production requires at least one approval).
- [ ] Firebase production configuration and the admin access plan have been confirmed.
- [ ] Release notes or a changelog entry have been added when user-visible behaviour changed.

## Deploy (human owner)

```bash
firebase use <prod-project-id>
yarn build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

> The service account used by the automation must have permission to deploy Hosting **and** Firestore rules (e.g. Firebase Hosting Admin + Firebase Rules Admin). Grant the same roles locally (or run deploys with an owner account) to avoid 403 errors.

## Post-deploy verification

- [ ] Smoke-test `/`, `/leaderboard`, `/display` and `/admin` against the
      production Firebase project.
- [ ] Confirm the live leaderboard receives an expected update and that an
      authorised admin can sign in.

## Rollback

- Revert merge commit (git revert -m 1 <sha>)

- Redeploy rules/hosting with the previous known-good commit

- Record the reverted commit and repeat the post-deploy verification checks.
