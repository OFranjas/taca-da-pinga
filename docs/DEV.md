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
