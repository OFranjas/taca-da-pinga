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

The CI/CD workflows need Firebase configuration. Use repository secrets for
preview and `develop`. Configure a GitHub environment named `production` with
the distinct production-only secrets below for the production deployment
workflow.

| Secret                              | Required | Description                                                                      |
| ----------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | ✅       | Firebase client config (same value as local dev)                                 |
| `VITE_FIREBASE_AUTH_DOMAIN`         | ✅       | Firebase client config                                                           |
| `VITE_FIREBASE_PROJECT_ID`          | ✅       | Firebase client config + default project fallback                                |
| `VITE_FIREBASE_STORAGE_BUCKET`      | ✅       | Firebase client config                                                           |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅       | Firebase client config                                                           |
| `VITE_FIREBASE_APP_ID`              | ✅       | Firebase client config                                                           |
| `FIREBASE_SERVICE_ACCOUNT`          | ✅       | JSON service account with Hosting + Firestore Rules deploy permissions           |
| `FIREBASE_PROJECT_ID`               | ⬜       | Override when the repo default project differs from the service account defaults |

> The service account must be able to create Hosting channels/sites and deploy
> Firestore rules and indexes (e.g. roles: `Firebase Hosting Admin` + `Firebase
Rules Admin` + `Cloud Datastore Index Admin` (`roles/datastore.indexAdmin`)).

The `Deploy Production` workflow is bound to the GitHub `production`
environment. Add these secrets there (do not reuse the repository-secret
names):

- `PRODUCTION_VITE_FIREBASE_API_KEY`
- `PRODUCTION_VITE_FIREBASE_AUTH_DOMAIN`
- `PRODUCTION_VITE_FIREBASE_PROJECT_ID`
- `PRODUCTION_VITE_FIREBASE_STORAGE_BUCKET`
- `PRODUCTION_VITE_FIREBASE_MESSAGING_SENDER_ID`
- `PRODUCTION_VITE_FIREBASE_APP_ID`
- `PRODUCTION_FIREBASE_PROJECT_ID`
- `PRODUCTION_FIREBASE_SERVICE_ACCOUNT`

This makes a merge to `production` fail safely until its production-only
configuration exists, rather than falling back to `develop` credentials. Add
required reviewers to the GitHub environment only if a post-merge approval gate
is desired before production deployment.

## Runtime Data

- Admin authorization is exclusively controlled by the Firebase Auth custom
  claim `admin: true`. The app and Firestore rules do not consult an
  `app_config/admins` allowlist.
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
The Firestore rules mirror the active Phase 1 IDs and pinga values so they can
authoritatively validate the stored `drinkTotals` projection; update the rules
and their emulator tests whenever this catalogue changes.

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

## PWA cache behaviour

Production builds register a service worker that caches the application shell
and runtime static assets. Firestore data remains live and network-backed, so
the leaderboard and admin tools are not supported as offline data-entry tools.

## Admin claims configuration

No environment variables are required. The tooling uses `tools/serviceAccountKey.json` (local only).
