# AGENTS.md — Taça da Pinga

Purpose: This file briefs AI coding agents (e.g., Codex) on how to work in this repo safely and effectively: how to set up, run, test, follow guardrails, and ship changes.

## Project Snapshot

- Stack: React (Create React App), Firebase (Auth, Firestore), CSS Modules.
- Core rule: UI components MUST NOT call Firestore directly. All I/O goes through the `src/services/` layer.
- Hosting: Firebase Hosting.
- Node: 22.19.0.
- Services: `src/services/leaderboard.js` (getLeaderboard, observeLeaderboard, addPinga, listEvents), `src/services/teams.js` (observeTeamsOrderedByName, createTeamIfNotExists, deleteTeam).

## Branching & PR Rules

- Branches: `feature/*` → `develop` → `production`
- Required CI check (exact string): **CI / Lint / Typecheck / Test / Build**
- Merge rules:
  - into `develop`: CI must be green.
  - into `production`: CI must be green **and** ≥1 approval (self-approval allowed).

## What You (the Agent) Should Do

When implementing a task:

1. **Create a feature branch**
   - Name: `feature/<short-slug>` from `develop`.

2. **Install & validate**

   ```bash
   corepack enable
   yarn install
   yarn lint
   yarn typecheck || echo "no TS yet"
   yarn test
   yarn build
   ```

3. **Use the services layer for data access**
   - Never import Firestore in components or pages.

   - Add/modify functions under src/services/\* and unit-test them.

4. **Follow coding guardrails**
   - See CODING_GUARDRAILS.md (formatting, testing, file layout, review checklist).

5. **Write tests**
   - Unit tests for services and hooks (Vitest).

   - Component tests with React Testing Library.

   - Firestore rules tests using the emulator.

   - E2E (Playwright) for happy paths when affected.

6. **Run the full suite locally** (same as CI) and ensure green before opening a PR.

7. **Open a PR to develop**
   - Keep the diff focused and small.

- Include test updates and doc updates when behavior/config changes.

- Request multi-file suggestions review from Codex Cloud.

## Setup Commands

- Install deps: corepack enable && yarn install

- Start dev server: yarn dev → http://localhost:5173 (Vite)

- Preview prod build: yarn preview

- Start emulators: firebase emulators:start --only firestore,auth

## Test Commands

- Lint: yarn lint

- Typecheck: yarn typecheck (noop acceptable until TS lands)

- Unit/Component: yarn test
- Unit/Component (CI): yarn test:ci

- Rules (emulator): yarn test:rules

- E2E (Playwright): yarn e2e

## Build Command

- yarn build

File/Folder Map

```
src/
  components/       # Presentational & container components (NO Firestore imports)
  pages/            # Route-level components (NO Firestore imports)
  services/         # All Firestore/Auth I/O lives here
  hooks/
  lib/
  assets/
```

## Security & Data Rules (must preserve)

- Public READ for leaderboard & audit events.

- Admin-only WRITE to leaderboard/events/app_config.

- “Add pinga” increments must be positive and bounded (e.g., 1..5).

- Update or add Firestore rules only with emulator tests in the same PR.

- App invariants are enforced both at service layer (validation) and Firestore rules (authoritative); verify via `yarn test:rules`.

## Secrets & Config

- Do NOT commit secrets. Use .env (dev only), Firebase project config for prod.

- See docs/CONFIG.md for required env keys and environment separation.

## Commit & PR Hygiene

- Commit messages: concise imperative (“fix: correct delta validation”).

- PR description: summary, scope, test plan, screenshots if UI.

- If you modify behavior, update README.md and docs/\* accordingly.

## CI Expectations

- GitHub Actions workflow name must be: CI / Lint / Typecheck / Test / Build

- Job should: install, lint, typecheck, test (CI mode), build.

- Your PR must pass CI before merge.

## Rollout & Rollback

- Release steps in docs/RELEASE.md.

- If a bad deploy ships, revert the merge commit and redeploy per docs.

## Boundaries (what NOT to do)

- Don’t broaden Firestore rules without emulator tests.

- Don’t access Firestore in components/pages.

- Don’t commit or rotate secrets; escalate to a human maintainer.

## Useful References in Repo

- CODING_GUARDRAILS.md — style, structure, review checklist.

- docs/DEV.md — local dev & emulator guide.

- docs/CONFIG.md — env variables & environments.

- docs/TESTING.md — test pyramid & commands.

- docs/RELEASE.md — release & rollback process.
