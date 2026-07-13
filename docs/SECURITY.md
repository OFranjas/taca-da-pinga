# Security Model

## AuthN / AuthZ

- Public can read leaderboard & events without auth.
- Admins authenticated via Firebase Auth; authorized via custom claim `admin` or email in `app_config/admins`.

## Firestore Rules (sketch)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    // Leaderboard teams
    match /teams/{teamId} {
      allow read: if true;                      // public reads
      allow write: if isAdmin();                // admin-only writes
    }
    // Audit events
    match /events/{eventId} {
      allow read: if true;                      // public reads
      allow write: if isAdmin();                // admin-only writes
    }
    // App config (reads restricted by default)
    match /app_config/{docId} {
      allow write: if isAdmin();
      allow read: if false;                     // not publicly readable
    }
  }
}
```

## Invariants

- Only admins can mutate (`teams`, `events`, `app_config`).
- Public can read `teams` and `events`; `app_config` is not publicly readable.
- “Add pinga” increments are positive and bounded (delta ∈ [1..50]).
- Totals never negative.
- Drink scoring is service-owned: the service validates active catalogue IDs,
  quantities, derived line deltas, duplicate consolidation, and receipt/projection
  consistency before committing one batch. Rules do not attempt to validate
  arbitrary dynamic receipt sums, but still enforce authorization and the score
  increment bound.

## Logging & Audit

- Every admin action must emit an events doc (ts, actorUid, type, delta, teamId).
- Drink scoring receipts add `schemaVersion: 2` and immutable item snapshots:
  `drinkId`, `drinkName`, `pingaValue`, `quantity`, and `lineDelta`.
