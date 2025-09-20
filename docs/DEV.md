# Developer Guide (DEV)

## Prerequisites

- Node 22.19.0 (use `.nvmrc`)
- Corepack enabled (`corepack enable`)
- Firebase CLI: `npm i -g firebase-tools`
- Java 11+ (emulators)

## Setup

```bash
corepack enable
yarn install
cp .env.example .env   # populate dev values
```

## Run the App (Vite)

```bash
yarn dev
# http://localhost:5173
```

## Emulators

```
firebase emulators:start --only firestore,auth
```

Dev test user (local only): testing@tests.com / testing

## Useful Scripts

- Lint: yarn lint / yarn lint:fix

- Typecheck: yarn typecheck

- Tests: yarn test

- Rules tests: yarn test:rules

- Build: yarn build (outputs to dist/). Use `yarn preview` to preview the production build.

## CI / Hosting Pipelines

- **PR Preview** (`.github/workflows/pr-preview.yml`)
  - Runs on every pull request and manual dispatch.
  - Installs deps, builds, deploys `hosting:preview` and clones the release to the static site `preview-taca-da-pinga.web.app`.
  - Useful for reviewers: the workflow comments the refreshable preview URL on the PR.

- **Deploy Develop** (`.github/workflows/deploy-develop.yml`)
  - Runs on every push to `develop`.
  - Executes lint → `test:ci` → `test:rules` → `typecheck` → `build` before deploying `hosting:develop` (site `develop-taca-da-pinga`).
  - The deploy step assumes `FIREBASE_SERVICE_ACCOUNT` can publish Hosting releases and Firestore rules.

Inspect failed runs in GitHub → Actions. Most failures stem from missing secrets or insufficient Firebase IAM roles.

## Admin (custom claims)

Admin-only Firestore writes are protected by a custom claim: `admin: true`.  
This repo includes a local tool to set/unset the claim (by UID or email).

### One-time setup

1. Firebase Console → **Project settings → Service accounts → Generate new private key**
2. Save it as `tools/serviceAccountKey.json` (**NEVER** commit this file)

### Usage with Yarn

```bash
# set by UID
yarn set:admin <UID>

# set by email
yarn set:admin --email someone@example.com

# unset by UID
yarn unset:admin <UID>

# unset by email
yarn unset:admin --email someone@example.com
```

After changing claims, have the user sign out/in again to refresh the ID token.
