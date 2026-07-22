# Drinks feature - implementation prompts

Use these prompts in order. Each assumes that the prior prompt has been completed and its validation is green. The complete product design is in [DRINKS_FEATURE_PLAN.md](./DRINKS_FEATURE_PLAN.md).

## Prompt 1 - Foundation and scoring contract

```text
You are implementing the foundation for the Drinks feature in the Taça da Pinga repository.

Read AGENTS.md, CODING_GUARDRAILS.md, docs/DRINKS_FEATURE_PLAN.md, docs/CONFIG.md, docs/TESTING.md, firestore.rules, src/services/leaderboard.js, src/services/teams.js, and the related service/rules tests before editing.

Context
- This is a clean-slate development environment. Development scoring data will be reset before production, so do not write migration or legacy-data compatibility code.
- The public leaderboard must keep using teams/{teamId}.pingas as its total score and must not change in this task.
- UI components/pages must never import firebase/firestore. All I/O belongs in src/services/.
- Phase 2 catalogue management and Phase 3 public team details are out of scope.

Implement only the scoring foundation:

1. Create a typed, developer-owned drink catalogue at src/config/drinks.ts.
   - Include stable lowercase kebab-case IDs, Portuguese name, positive integer pingaValue, active boolean, order number, and optional local image source.
   - Add a small, clearly editable initial catalogue. Do not use app_config and do not call Firestore from this module.

2. Add a service-layer mutation for drink-based scoring. Use a clear API such as:
   addDrinkPingas({ teamId, items, actorUid })
   where items are { drinkId, quantity } entries.
   - Validate team ID, known/active drinks, positive integer quantities, and duplicate selections.
   - Consolidate duplicate drink IDs before calculating totals.
   - Derive, never accept, the score delta from the configured values.
   - Preserve the current 1-50 total-pingas-per-submission guardrail.
   - In one Firestore batch, increment teams/{teamId}.pingas, update teams/{teamId}.drinkTotals for quantity and pinga contribution, and create an events receipt.
   - The receipt must retain the current audit fields and include schemaVersion: 2 plus immutable item snapshots: drinkId, drinkName, pingaValue, quantity, lineDelta.
   - Use safe Firestore field paths for drink IDs. Do not use arbitrary display names as map keys.

3. Update Firestore Rules and emulator tests only as necessary to support the new team document shape while preserving current protections:
   - public reads for teams/events;
   - admin-only writes;
   - team pingas can only increase by an integer amount in 1..50;
   - no broader permissions.
   Be explicit in comments/tests that the service validates dynamic drink receipt consistency; the current client-write rules cannot prove an arbitrary receipt sum.

4. Add or update unit tests under src/services/__tests__/ for:
   - mixed drinks and correct derived total;
   - duplicate drink consolidation;
   - unknown/inactive drink rejection;
   - invalid quantity rejection;
   - total below 1 or above 50 rejection;
   - exact batch team projection and receipt payload.

5. Update docs/CONFIG.md, docs/TESTING.md, and docs/SECURITY.md for the new catalogue, team projection, receipt fields, and test expectations.

Do not change AddPingasPanel UI yet. Do not add Firestore drink management, image upload, Cloud Functions, new dependencies, or a public drink-details UI.

Before finishing:
- run the focused service tests and rules tests;
- run yarn lint, yarn typecheck, yarn test:ci, and yarn build as practical for the repository;
- run git diff --check;
- report changed files, test evidence, any limitations, and exact manual steps required to reset/seed development scoring data.
```

## Prompt 2 - Phase 1 admin scoring experience

```text
You are implementing the Phase 1 Drinks scoring interface in the Taça da Pinga repository.

Read AGENTS.md, CODING_GUARDRAILS.md, docs/DRINKS_FEATURE_PLAN.md, and docs/DRINKS_IMPLEMENTATION_PROMPTS.md. Inspect the completed drink scoring service and tests from Prompt 1 before editing. Also inspect src/components/AddPingasPanel.tsx, its CSS module, AdminShell, existing UI primitives, and relevant component tests.

Context
- The drink catalogue and addDrinkPingas service already exist. Use them through the service layer only.
- The initial catalogue is deliberately small, around 3-6 active drinks.
- Phase 2 drink management and Phase 3 public team details are out of scope.
- Do not alter the public leaderboard or add Firestore imports to components/pages.

Replace the raw numeric pinga entry in AddPingasPanel with a fast drink-quantity workflow:

1. Retain the existing searchable team selector and loading/error behaviour.

2. Display every active configured drink as a compact scoring row. Each row needs:
   - optional 32-40px image thumbnail with a stable fallback when no image is configured or it fails;
   - drink name;
   - visible unit value in Portuguese, for example "2 pingas/un.";
   - accessible minus, quantity, and plus controls;
   - calculated line subtotal.
   All quantities start at zero. Do not use a "select drink then add another row" pattern for this small catalogue.

3. Add a clear summary below the rows, such as "4 bebidas · +5 pingas", and a text action "Limpar" that resets quantities without clearing the selected team.

4. The primary action remains one full-width "Adicionar" button:
   - disabled until a team is selected and the derived total is at least 1;
   - prevents totals above 50 and explains the limit clearly;
   - sends only positive quantity selections to addDrinkPingas;
   - prevents duplicate submissions;
   - on success, shows a useful Portuguese toast summarising the drinks and total, then resets team and quantities.

5. Preserve the project's existing visual language:
   - CSS Modules and existing --ui-* tokens;
   - green primary action, compact rounded controls, clear focus states;
   - minimum 44px touch targets for steppers;
   - one-column mobile layout at narrow widths;
   - no new design system or dependency.

6. Make the interaction accessible:
   - visible labels, semantic buttons and inputs, precise accessible names;
   - predictable keyboard tab order;
   - derived total communicated to assistive technology without disruptive announcements;
   - loading and error states remain clear.

Add or update component tests for derived totals, disabled/enabled submit, mixed drinks, 1-50 validation, clearing, successful reset, keyboard behaviour, and error rendering. Update any service mocks to use the new mutation.

Do not add Admin "Gerir bebidas", Firestore catalogue reads, image uploads, public team drill-downs, or leaderboard table changes.

Before finishing:
- run focused component/service tests;
- run yarn lint, yarn typecheck, yarn test:ci, and yarn build as practical;
- run git diff --check;
- if possible, inspect the Add Pingas flow in a real browser at desktop and 390px mobile;
- report changed files, test evidence, and screenshots or browser observations.
```

## Prompt 3 - Phase 1 release verification and polish

```text
You are performing the final Phase 1 release-readiness pass for the Drinks scoring feature in the Taça da Pinga repository.

Read AGENTS.md, CODING_GUARDRAILS.md, docs/DRINKS_FEATURE_PLAN.md, docs/DRINKS_IMPLEMENTATION_PROMPTS.md, and the completed diffs for Prompts 1 and 2. This is not a feature-expansion task. Fix only concrete defects or omissions needed for a reliable Phase 1 release.

Required checks

1. Review architecture and scope:
   - no firebase/firestore import exists under src/components or src/pages;
   - every Firestore mutation belongs in src/services;
   - no Phase 2 catalogue management or Phase 3 public details leaked into the change;
   - leaderboard and /display remain total-only.

2. Verify data correctness:
   - one mixed-drink submission atomically writes the team total, drinkTotals projection, and v2 event receipt;
   - receipt snapshots match configured values at submission time;
   - duplicate, invalid, inactive, zero, negative, non-integer, and over-50 submissions fail safely;
   - retry/double-submit protection is present in the UI.

3. Verify security and tests:
   - Firestore Rules still preserve public reads, admin-only writes, and the positive 1-50 team-score increment;
   - rules tests cover the new document shape without widening access;
   - service and component tests cover the behaviour, not implementation details.

4. Perform visual and interaction QA in a real browser if available:
   - desktop Add Pingas flow;
   - 390px mobile flow;
   - keyboard-only team selection and drink quantity control;
   - disabled, loading, success, validation, and failure states;
   - no clipped text, broken image fallback, horizontal overflow, or unreadable controls.

5. Update only documentation needed for accurate operator guidance:
   - clearly state that development scoring data must be reset before production;
   - state how the developer edits the Phase 1 catalogue;
   - state the 1-50 derived-total limit.

Run and report:
- yarn lint
- yarn typecheck
- yarn test:ci
- yarn test:rules
- yarn build
- git diff --check

If a command cannot run, state the exact failure and whether it is related to the Drinks diff. Do not open a PR, deploy, add Phase 2/3 functionality, or perform unrelated refactors.

Finish with a concise release-readiness report: changed files, commands/results, remaining known limitation (client-side receipt consistency is trusted-admin/service-enforced), and the exact condition under which Phase 2 can begin.
```
