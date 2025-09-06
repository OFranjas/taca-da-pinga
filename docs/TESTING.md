# Testing Strategy

## Pyramid

- Unit: services/hooks
- Component: RTL
- Rules: Firestore emulator
- E2E: Playwright (smoke)

## Commands

```bash
npm test -- --watch=false        # unit + component (Jest)
npm run test:rules               # Firestore security rules (emulator)
npm run e2e                      # end-to-end (Playwright)

Ensure Firestore emulator is running for rules tests:

```

firebase emulators:start --only firestore

```

```

## Service Unit Tests

- Place service tests under `src/services/__tests__/`.
- Mock `firebase/firestore` and `src/firebase` as needed to avoid network/emulator.
- Example grep to ensure UI layers do not import Firestore directly:

```
git grep "from 'firebase/firestore'" src/components src/pages
# should return no matches
```

## Jest Configuration

- We use Jest (temporary until Vitest migration).
- Config lives at `jest.config.js` with `jsdom` environment and `babel-jest` transform.
- CSS Modules are mapped via `identity-obj-proxy`; assets use a file stub.

## Firestore Rule Invariants

- Allowed
  - Public READ for `teams` (leaderboard) and `events`.
  - Admin WRITE to `teams`, `events`, and `app_config`.
  - Admin increments to `teams.pingas` with delta in [1..5].

- Denied
  - Non-admin writes anywhere.
  - Increments > 5 or any decrement to `teams.pingas`.
  - Totals going negative.
  - Public READ of `app_config`.

Rules tests live under `rules-tests/` and run via `npm run test:rules`.
