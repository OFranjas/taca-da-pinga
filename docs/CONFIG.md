# Configuration & Environments

## Environment Variables (dev)

Create `.env` from `.env.example` and fill:

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

## Runtime Config

- Admin allowlist: `app_config/admins` document in Firestore (or custom claim `admin`).
- Collections:
  - `leaderboard` (teams): { teamId, name, points, updatedAt }
  - `events` (audit): { ts, actorUid, type, delta, teamId }

## Environments

- Separate Firebase projects for `develop` and `production`.
- Never reuse prod keys locally.
