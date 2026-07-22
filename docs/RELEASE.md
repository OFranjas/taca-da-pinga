# Release & Rollback

## Automation Overview

- Pull requests automatically publish previews at `https://preview-taca-da-pinga.web.app`.
- Merges to `develop` auto-deploy to `https://develop-taca-da-pinga.web.app` after re-running lint/tests/build.
- Merges to `production` run the production deployment workflow after its
  validation steps pass.

## Pre-merge to `production`

- [ ] The `develop` → `production` PR is current and mergeable.
- [ ] **CI / Lint / Typecheck / Test / Build** is green for the PR head.
- [ ] The PR preview or `develop` deployment has been visually checked on desktop and mobile.
- [ ] Firestore rules and indexes are included when their source files changed.
- [ ] Required approval is recorded (production requires at least one approval).
- [ ] Firebase production configuration and the admin access plan have been confirmed.
- [ ] Release notes or a changelog entry have been added when user-visible behaviour changed.

## Production deployment

The `Deploy Production` workflow runs automatically after a merge to
`production`. It validates, builds, deploys Firestore rules and indexes, then
deploys the `taca-da-pinga` Firebase Hosting site. Manual workflow runs are
allowed only when the selected ref is `production`.

For a manual local production deployment, `./deploy.sh` builds the app and
deploys only `hosting:taca-da-pinga`; it does not deploy the `develop` Hosting
target. Confirm that the active Firebase credentials and project are the
intended production ones before running it.

Configure the GitHub **production** environment with the `PRODUCTION_*` secrets
listed in [CONFIG.md](CONFIG.md#github-secrets). The service account needs
Firebase Hosting Admin, Firebase Rules Admin, and Cloud Datastore Index Admin
(`roles/datastore.indexAdmin`) permissions for that production project. Required
reviewers are optional if a post-merge approval gate is desired.

## Post-deploy verification

- [ ] Smoke-test `/`, `/leaderboard`, `/display` and `/admin` against the
      production Firebase project.
- [ ] Confirm the live leaderboard receives an expected update and that an
      authorised admin can sign in.

## Rollback

- Revert merge commit (git revert -m 1 <sha>)

- Redeploy rules/hosting with the previous known-good commit

- Record the reverted commit and repeat the post-deploy verification checks.
