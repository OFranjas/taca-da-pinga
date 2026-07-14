# Drinks and Pinga Values - Feature Plan

## Purpose

Introduce named drinks with configurable pinga values while preserving the current leaderboard as the fast, public source of truth for each team's total pingas.

The feature is deliberately split into three delivery phases:

1. **Critical**: a developer-configured drink catalogue used when adding pingas.
2. **Useful next step**: admin management of that catalogue.
3. **Nice to have**: public team drink details.

The proposal is designed to work with React, the existing CSS-module UI system, Firebase Auth, Firestore batches, and the project's service-layer boundary. It makes no changes to the public leaderboard in the critical phase.

## Separate-environment assumption

Develop and production use separate Firebase projects, so no development-data
reset is required to deploy Phase 1. Existing development teams can continue to
be used for Phase 1 testing; their old raw totals simply have no drink
breakdown, which is harmless until Phase 3. Production should start with the
intended initial team and catalogue data.

If a maintainer ever intends to reuse a Firebase project containing test
scoring data for production, explicit approval for a targeted reset plan is
required. No destructive reset is prescribed by default.

Phase 1 introduces drink receipt and team-breakdown fields without legacy event
compatibility, data migration, or historical-attribution UI. This does **not**
remove the value of stable drink IDs and immutable event snapshots: those
protect production data created after launch when a drink is later renamed,
repriced, or deactivated.

## Product decisions

### What a drink represents

A drink is a catalogue item with a stable identifier, a Portuguese display name, an integer pinga value per unit, an optional image, and an active state.

Examples for a first developer-owned catalogue:

| Stable ID      | Display name  | Pingas per unit |
| -------------- | ------------- | --------------: |
| `beer`         | Cerveja       |               1 |
| `cider`        | Cidra         |               1 |
| `sangria`      | Sangria       |               1 |
| `white-spirit` | Bebida branca |               5 |
| `metro`        | Metro         |              11 |

The IDs are permanent internal keys, not names. They must be lowercase kebab-case, must not contain `.`, and must never be recycled. A name or value may change later without rewriting history.

### The score remains total-first

`teams/{teamId}.pingas` remains the authoritative, materialized score used for the leaderboard query and ranking. This means no leaderboard index, display, or performance regression is needed for Phase 1.

Each add operation becomes a receipt containing one or more drink lines. The service calculates the resulting total, validates it, atomically increments `teams.pingas`, and records the receipt in `events`.

### Historical records are immutable

Every drink line stored in an event captures the drink's name and value at the moment of scoring. Changing a drink from 1 to 2 pingas in Phase 2 affects only future scoring.

This prevents renamed, deactivated, or repriced drinks from changing a team's historical total or future team-detail view.

## Design direction

Reading this as: a high-frequency admin scoring task for a playful tournament product, with an established clean and compact product UI, leaning toward the existing project UI primitives and CSS tokens rather than a new design system.

The entry flow should be quick and calm rather than decorative. The existing green action colour, rounded controls, 44px touch targets, loading states, and inline form feedback are already the correct visual language. Drink images should be small recognisable thumbnails, not dominant cards or large media.

## Recommended data contract

### Phase 1 source catalogue

Create a developer-owned typed catalogue, for example `src/config/drinks.ts`:

```ts
export type DrinkIconName = 'beer' | 'bottle' | 'sangria' | 'spirit' | 'metro';

export type ConfiguredDrink = {
  id: string;
  name: string;
  pingaValue: number;
  icon: DrinkIconName;
  imageSrc?: string;
  active: boolean;
  order: number;
};
```

Images are optional in this phase. When supplied, use local repository assets imported by the catalogue. The typed icon selects the consistent decorative fallback used if an image is absent or fails to load.

This configuration is intentionally not stored in `app_config`: client reads of that collection are denied by the current security rules, while the admin scoring form must read the catalogue.

### Events: receipt schema

Keep the current base audit fields and make the receipt fields below part of every production drink-scoring event.

```ts
{
  ts: serverTimestamp(),
  actorUid: string | null,
  type: 'add-pinga',
  teamId: string,
  delta: number,
  schemaVersion: 2,
  items: [
    {
      drinkId: 'beer',
      drinkName: 'Cerveja',
      pingaValue: 1,
      quantity: 3,
      lineDelta: 3
    }
  ]
}
```

`delta` is the sum of all `lineDelta` values. The service consolidates duplicate drink selections before writing the receipt.

### Team projection, prepared for Phase 3

When a drink receipt is written, also atomically update a compact projection on the team document:

```ts
{
  pingas: 42,
  drinkTotals: {
    beer: { quantity: 18, pingas: 18 },
    'white-spirit': { quantity: 4, pingas: 20 }
  }
}
```

`drinkTotals` supports a later detail view without querying every event. It is a rebuildable projection; events are the historical record. Because production starts after the drink model is introduced, all production points can be attributed to configured drinks and no legacy row is needed.

This shape is appropriate for the expected small catalogue. If the app grows to dozens of active drinks per team, move the projection to a team subcollection before the document becomes unwieldy.

## Phase 1 - developer-configured drinks in Add Pingas

### Scope

Replace raw total entry with drink quantities. The developer maintains the catalogue in code and deploys changes with the application.

### Admin experience

1. The admin searches for and selects a team using the existing autocomplete.
2. The form displays the 3-6 active configured drinks as compact rows, initially at quantity zero.
3. Each row has an optional 32-40px thumbnail or fallback icon, drink name, immutable `X pingas/un.` label, accessible minus/quantity/plus controls, and a calculated row subtotal.
4. A persistent summary shows total drinks and the derived total, such as `4 bebidas · +5 pingas`.
5. The single primary action reads `Adicionar` and is disabled until a team is selected and the derived total is positive.
6. `Limpar` resets drink quantities without clearing the selected team. A successful submission resets both team and quantities, following the current interaction.

The transaction limit stays at the existing **1-50 pingas total per submission**. The UI should communicate remaining capacity when an action would exceed the limit and should not let a quantity control silently create an invalid order.

For the initial small catalogue, show all active drinks directly. This is faster and clearer than a select-and-add-row interaction. If the catalogue grows beyond roughly eight active drinks, replace the all-drinks list with a searchable drink picker plus selected line items.

### Responsive and accessible behaviour

- Desktop: team selection first, then drink rows; do not attempt to fit several drinks into the current two-column team-plus-total row.
- Mobile: retain a one-column flow, 44px stepper controls, and a full-width submit action at the bottom of the panel.
- Every control has a visible label and a precise accessible name, including drink name, unit value, quantity, and calculated subtotal.
- Preserve keyboard navigation, focus treatment, loading feedback, and success/error toasts. The summary is announced when the derived total changes.
- Use small `object-fit: cover` thumbnails with an image fallback. Never make scoring depend on an image loading.

### Service and transaction design

Add the mutation at the services layer, not in a component. The recommended public API is conceptually:

```ts
addDrinkPingas({ teamId, items, actorUid });
```

It accepts `{ drinkId, quantity }[]`, looks up IDs in the developer catalogue, rejects unknown or inactive drinks, checks positive integer quantities, consolidates duplicates, derives the pinga total, and rejects totals outside 1-50.

One Firestore batch then:

1. increments `teams.pingas` by the derived total;
2. increments the relevant `drinkTotals.<id>.quantity` and `.pingas` fields using safe field paths;
3. creates the immutable v2 event receipt.

No component or page may import Firestore directly.

### Phase 1 implementation map

| Area                                                                 | Planned change                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/config/drinks.ts`                                               | New typed developer catalogue and optional local image imports.                               |
| `src/services/leaderboard.js` or a focused drink-scoring service     | Validate selections, calculate totals, and write the team projection plus receipt batch.      |
| `src/components/AddPingasPanel.tsx`                                  | Replace raw pinga picker with the selected-team and drink-quantity workflow.                  |
| `src/components/AddPingasPanel.module.css`                           | Compact drink rows, derived summary, mobile layout, and state styles using existing tokens.   |
| `src/services/__tests__/`                                            | Receipt arithmetic, validation, duplicate consolidation, and exact batch writes.              |
| `src/components/__tests__/`                                          | Derived total, disabled state, validation, keyboard interactions, and reset after success.    |
| `rules-tests/`                                                       | Preserve the 1-50 team score invariant and add coverage for the new permitted document shape. |
| `docs/CONFIG.md`, `docs/TESTING.md`, `docs/SECURITY.md`, `README.md` | Document the catalogue, audit fields, limits, and test coverage.                              |

### Phase 1 acceptance criteria

- A developer can add, hide, rename, value, or reorder configured drinks in a single code configuration file.
- An admin can record several drink types in one submission, with a correctly derived total of 1-50 pingas.
- Team total and drink projection update atomically with an event receipt.
- Production uses its dedicated Firebase project and starts with the intended drink-aware team and event shape, so no migration or legacy presentation is required.
- The public leaderboard remains visually and behaviourally total-only.
- Service, component, rules, and affected end-to-end tests are green.

## Phase 2 - Drinks management in Admin

### Scope

Move the runtime catalogue to a public-read, admin-write `drinks` collection. Add a fourth Admin section, `Gerir bebidas` (`Bebidas` on mobile), alongside Add Pingas, Teams, and Sponsors.

### Firestore model

```ts
// drinks/{drinkId}
{
  name: 'Cerveja',
  pingaValue: 1,
  imageDataUrl?: 'data:image/...',
  active: true,
  order: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

Reuse the existing image compression utility and 180KB validated data-URL limit if image uploads are enabled. The image remains optional.

Reads must be public so the Phase 1/2 scoring interface and future public details can resolve the catalogue. Writes are admin-only. Rules validate name length, positive bounded integer value, boolean active state, order range, and any supplied image. A Firestore index is not expected for an `order` query alone.

### Lifecycle rules

- **Stable ID**: never changes after creation.
- **Rename/value edit**: applies only to future receipts. Stored event snapshots remain untouched.
- **Deactivate**: removes a drink from future scoring but keeps it visible in historical details.
- **Hard delete**: do not expose it once a drink has any history. Prefer deactivation. A hard delete is only reasonable for an unused mistake and should require confirmation.

### Admin experience

Use the Sponsors admin panel as the implementation precedent, not a new visual pattern:

- A compact creation form with `Nome`, `Pingas por unidade`, and optional image upload with preview/fallback.
- An active/inactive list below it. Each row shows thumbnail, name, unit value, visibility toggle, edit, and the appropriate destructive action.
- Inline edit or an edit mode that preserves the clear labels, save/cancel actions, loading states, confirmation dialog, error feedback, skeleton, and touch/keyboard accessibility already used for sponsors.
- Only add drag reordering if the Phase 1 list requires an explicit custom order. If it does, reuse the existing accessible dnd-kit implementation.

On mobile, the form stacks vertically and item actions become easy full-width or bottom-aligned actions. The page must not compress text inputs and numeric inputs into an unreadable horizontal row.

### Migration from Phase 1

1. Keep the Phase 1 IDs unchanged.
2. Add a one-off privileged seed script that writes each code-configured drink to `drinks/{stableId}`.
3. Deploy the service that observes active drinks from Firestore, then remove the runtime catalogue dependency after verifying the seeded records.
4. Keep the original catalogue only as a seed fixture or delete it once the new source is proven in develop and production.

No production receipt needs migration because the dedicated production dataset starts with the drink-aware schema. Development data can remain in place for testing; only a proposal to reuse test data in production requires an explicitly approved reset plan.

### Phase 2 acceptance criteria

- Admin can create, edit, activate, and deactivate drinks without a code deployment.
- Deactivated drinks cannot be selected in Add Pingas but remain understandable in existing history.
- Images have a graceful fallback and meet the established payload limit.
- Security rules and emulator tests reject invalid and non-admin drink mutations.
- A seeded Phase 1 catalogue produces the same add-pingas choices and totals after the runtime source moves to Firestore.

## Phase 3 - Team drink details

### Scope

Expose a read-only drink breakdown on demand while preserving the current leaderboard table and its display-mode performance.

### Public experience

Keep the current leaderboard's rank, team name, and total-pingas columns unchanged. Add an explicit `Ver bebidas` control or labelled chevron for each normal leaderboard row. Do not make the entire row a surprising modal trigger and do not add per-drink columns.

Opening the control shows:

- Desktop: a side sheet or focused dialog.
- Mobile: a bottom sheet or dedicated full-page detail route.
- Content: team name, rank, normal total, then drink rows with small image/fallback, drink name, quantity, and pinga contribution.

The `/display` TV mode remains non-interactive and total-only. It should not load or render the detail affordance.

Load the breakdown only after explicit user intent. This protects leaderboard rendering and virtualization when many teams are present.

### Integrity and scale decision

The current client-side Firestore model can preserve the authoritative team total rule, but Firestore Rules cannot generally prove that an arbitrary set of dynamic drink items exactly matches the score increment and drink map changes. Current admins can already write direct team and event documents.

Phase 1 is acceptable if the trusted admin UI is the intended security boundary and service validation is thoroughly tested. Before Phase 3 is treated as an authoritative audit, add a callable Cloud Function or equivalent privileged mutation endpoint that:

1. loads and validates active drinks server-side;
2. derives the delta from quantities;
3. atomically writes the team total, projection, and receipt;
4. prevents direct client writes to score, projection, and events in the Firestore rules.

This is a deliberate backend addition, not a prerequisite for the smallest Phase 1.

### Phase 3 acceptance criteria

- The total pinga contribution across drink rows equals the ordinary leaderboard total.
- Historical names and values come from event snapshots, even after catalogue changes.
- The board remains total-only and performant; display mode is unaffected.
- The detail view is fully keyboard accessible, responsive, and has a clear empty state.
- If audit-grade integrity is required, direct client score writes are removed in favour of the server-side mutation before release.

## Security and privacy notes

- Keep events public only if their new receipt fields contain no personal information beyond the existing actor ID and team association.
- Continue enforcing admin-only writes and the resulting 1-50 positive team-score increment in Firestore Rules.
- Treat client/service validation as defence in depth, not the sole security authority.
- Do not accept arbitrary external image URLs. Use local assets in Phase 1 and optional validated image data URLs in Phase 2.
- Do not broaden existing team/event write access without emulator tests in the same change.

## Delivery sequence

1. Approve the catalogue rules, initial drinks, and whether an image is needed for every drink or only when supplied.
2. Implement and test Phase 1 on a `feature/` branch from `develop`.
3. Validate the desktop and 390px mobile scoring flows with a real browser, including keyboard-only use.
4. Before production launch, select the dedicated production Firebase project and seed the intended initial team and catalogue data. If reusing a project containing test scoring data is ever proposed, stop for explicit approval of a targeted reset plan.
5. Decide whether Phase 2 is needed immediately. If yes, seed the catalogue and move it to Firestore without changing the receipt contract.
6. Revisit Phase 3 only after enough drink-based events exist to make the details useful. Choose whether its audit must be server-authoritative before implementation.

## Questions resolved by this plan

- **Can drinks have different values?** Yes. Values are per unit and are snapshotted on every scored receipt.
- **Can a submission include several drink types?** Yes. One atomic receipt can contain quantities for multiple drinks.
- **Can the catalogue evolve later?** Yes. Stable IDs and receipt snapshots make the Phase 1 code catalogue compatible with Phase 2 Firestore management.
- **Will the leaderboard become cluttered?** No. It remains a total-pingas leaderboard. Details are deferred to an explicit Phase 3 drill-down.
- **Do existing development points need a drink migration?** No. They can remain for testing; only a deliberate reuse of test data in production requires a separately approved reset plan.
