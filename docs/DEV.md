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
