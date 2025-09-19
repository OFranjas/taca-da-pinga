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

## Runtime Config

- Admin allowlist: `app_config/admins` document in Firestore (or custom claim `admin`).
- Collections:
  - `teams`: { id, name, pingas }
  - `events` (audit): { ts, actorUid, type, delta, teamId }
  - `branding/current`: { mainLogoDataUrl?, iconDataUrl? } (data URLs, max 180 KB each)
  - `sponsors/{id}`: { name (≤80 chars), link (empty or https URL), imageDataUrl (≤180 KB data URL), active (bool), order (0-999) }

## Environments

- Separate Firebase projects for `develop` and `production`.
- Never reuse prod keys locally.

## Admin claims configuration

No environment variables are required. The tooling uses `tools/serviceAccountKey.json` (local only).
