# Developer Guide (DEV)

## Prerequisites

- Node 18+
- Firebase CLI: `npm i -g firebase-tools`
- Java 11+ (emulators)

## Setup

```bash
npm ci
cp .env.example .env   # populate dev values
```

## Run the App

```bash
npm start
# http://localhost:3000
```

## Emulators

```
firebase emulators:start --only firestore,auth
```

Dev test user (local only): testing@tests.com / testing

## Useful Scripts

- Lint: npm run lint / npm run lint:fix

- Typecheck: npm run typecheck

- Tests: npm test -- --watch=false

- Rules tests: npm run test:rules

- Build: npm run build
