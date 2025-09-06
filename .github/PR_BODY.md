## What

- Migrate unit/component testing from Jest to Vitest after the Vite migration.
- Migrate Firestore rules tests to Vitest as well.
- Keep React Testing Library and coverage reporting.
- Update scripts, CI, and docs accordingly.

## Why

- Align test runners with Vite for faster, simpler DX (no Babel transform needed).
- Reduce dependency surface (drop Jest-specific tooling entirely).
- Keep CI check name the same: CI / Lint / Typecheck / Test / Build.

## How

- Root deps: add `vitest`, `@vitest/coverage-v8`, `jsdom`; remove root Jest deps and config.
- Root config: `vite.config.js` test block (jsdom, setup, globals, CSS, v8 coverage, exclude `rules-tests/**`).
- Setup: `src/test/setup.ts` with `@testing-library/jest-dom/vitest`.
- Tests: replace `jest.*` with `vi.*` in service tests; fix JSX test filename.
- Scripts: `test` -> `vitest`, `test:ci` -> `vitest --run --coverage`.
- CI: use `npm run test:ci` in Unit tests step; retain workflow/job names.
- ESLint: switch globals to `vitest`; adjust lint-staged to only lint JS in `src/**` to avoid subpackage noise.
- Docs: update AGENTS.md, docs/TESTING.md, README.md.
- Rules subpackage: replace Jest with Vitest (`vitest.config.mjs`, ESM imports), keep run via `npm run test:rules` (emulator).

## Checks

- [x] Lint
- [x] Typecheck (noop)
- [x] Tests passing locally (Vitest + coverage)
- [x] Rules tests passing locally (Vitest + emulator)
- [x] Docs updated (README/TESTING/AGENTS)
