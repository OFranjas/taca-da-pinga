# Configuration & Environments

## Environment Variables (dev)

Create `.env` from `.env.example` and fill (Vite prefixes envs with `VITE_`):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## GitHub Secrets

The CI/CD workflows rely on the same Firebase configuration. Add these repository secrets:

| Secret                              | Required | Description                                                                      |
| ----------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | ✅       | Firebase client config (same value as local dev)                                 |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ✅       | Firebase client config                                                           |
| `VITE_FIREBASE_PROJECT_ID`          | ✅       | Firebase client config + default project fallback                                |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ✅       | Firebase client config                                                           |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅       | Firebase client config                                                           |
| `VITE_FIREBASE_APP_ID`              | ✅       | Firebase client config                                                           |
| `FIREBASE_SERVICE_ACCOUNT`          | ✅       | Base64/JSON service account with Hosting + Firestore Rules deploy permissions    |
| `FIREBASE_PROJECT_ID`               | ⬜       | Override when the repo default project differs from the service account defaults |

> The service account must be able to create Hosting channels/sites and deploy Firestore rules (e.g. roles: `Firebase Hosting Admin` + `Firebase Rules Admin`).

## Runtime Config

- Admin allowlist: `app_config/admins` document in Firestore (or custom claim `admin`).
- Collections:
  - `teams`: { id, name, pingas, drinkTotals }
    - `pingas` remains the public leaderboard total.
    - `drinkTotals.{drinkId}` contains `{ quantity, pingas }` projection counters.
  - `events` (audit): `{ ts, actorUid, type, delta, teamId, schemaVersion, items }`.
    - Drink receipts use `schemaVersion: 2` and immutable items with
      `{ drinkId, drinkName, pingaValue, quantity, lineDelta }`.
  - `branding/current`: { mainLogoDataUrl?, iconDataUrl? } (data URLs, max 180 KB each)
  - `sponsors/{id}`: { name (≤80 chars), link (empty or https URL), imageDataUrl (≤180 KB data URL), active (bool), order (0-999) }

## Developer-owned drinks catalogue

Phase 1 drinks are configured in `src/config/drinks.ts`. Each entry has a stable
lowercase kebab-case `id`, Portuguese `name`, positive integer `pingaValue`,
`active` flag, `order`, a typed fallback `icon`, and optional local `imageSrc`.
The catalogue is bundled with the application; it is not read from `app_config`
or Firestore. IDs must not be renamed or recycled after scoring data uses them.

Each submission uses the derived catalogue total and must be between 1 and 50
pingas. The UI, service, and Firestore Rules enforce this bound.

No development-data reset is required to deploy Phase 1. Production must use
its dedicated Firebase project and should start with the intended initial team
and catalogue data. Existing development teams can continue to be used for
Phase 1 testing; old raw totals simply have no drink breakdown, which is
harmless until Phase 3.

If a maintainer ever intends to reuse a Firebase project containing test
scoring data for production, stop and obtain explicit approval for a targeted
reset plan. Do not run destructive deletion commands by default.

## Environments

- Separate Firebase projects for `develop` and `production`.
- Never reuse prod keys locally.

## Admin claims configuration

No environment variables are required. The tooling uses `tools/serviceAccountKey.json` (local only).
