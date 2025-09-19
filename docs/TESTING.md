# Testing Strategy

## Pyramid

- Unit: services/hooks
- Component: RTL
- Rules: Firestore emulator
- E2E: Playwright (smoke)

## Commands

```bash
yarn test                        # unit + component (Vitest)
yarn test:ci                     # CI mode with coverage
yarn test:rules                  # Firestore security rules (emulator)
yarn e2e                         # end-to-end (Playwright)

# `yarn test:rules` ensures Java is available (JAVA_HOME or Homebrew openjdk)
# before launching `firebase emulators:exec`.
```

When iterating on security rules interactively, run the emulator in a separate
terminal instead:

```
firebase emulators:start --only firestore
```

## Service Unit Tests

- Place service tests under `src/services/__tests__/`.
- Mock `firebase/firestore` and `src/firebase` as needed to avoid network/emulator.
- Example grep to ensure UI layers do not import Firestore directly:

```
git grep "from 'firebase/firestore'" src/components src/pages
# should return no matches
```

## Vitest Configuration

- Tests run with Vitest configured in `vite.config.js` under the `test` block.
- Environment: `jsdom`, globals enabled, CSS handling on.
- Setup file: `src/test/setup.ts` (adds `@testing-library/jest-dom/vitest`).
- Coverage: V8 provider with `text` and `lcov` reporters.

## Firestore Rule Invariants

- Allowed
  - Public READ for `teams` (leaderboard) and `events`.
  - Admin WRITE to `teams`, `events`, and `app_config`.
  - Admin increments to `teams.pingas` with delta in [1..5].
  - Public READ for `branding/current` and `sponsors`; admin writes must keep
    image data URLs ≤ 180 KB.

- Denied
  - Non-admin writes anywhere.
  - Increments > 5 or any decrement to `teams.pingas`.
  - Totals going negative.
  - Public READ of `app_config`.
  - Invalid branding payloads (non-image data URLs or oversized assets).
  - Invalid sponsor payloads (name > 80 chars, non-HTTPS links, bad image data,
    non-bool `active`, or `order` outside 0–999).

Rules tests live under `rules-tests/` and run via `yarn test:rules`.
