# Security Model

## AuthN / AuthZ

- Public can read leaderboard & events without auth.
- Admins authenticate with Firebase Auth and are authorized exclusively by the
  custom claim `admin: true`.

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
    // Branding and sponsors
    match /branding/current {
      allow read: if true;
      allow write: if isAdmin();                // image data is separately validated
    }
    match /sponsors/{sponsorId} {
      allow read: if true;
      allow write: if isAdmin();                // fields and HTTPS links are validated
    }
  }
}
```

## Invariants

- Only admins can mutate `teams`, `events`, `app_config`, branding and sponsors.
- Public can read `teams`, `events`, `branding/current` and sponsors;
  `app_config` is not publicly readable.
- “Add pinga” increments are positive and bounded (delta ∈ [1..50]).
- Totals never negative.
- Branding and sponsor images must be image data URLs at most 180 KB. Sponsor
  names are limited to 80 characters, links must be HTTPS (or empty), and
  ordering is bounded from 0 to 999.
- Drink scoring is service-owned: the service validates active catalogue IDs,
  quantities, derived line deltas, duplicate consolidation, and receipt/projection
  consistency before committing one batch. Firestore rules mirror the fixed
  Phase 1 drink catalogue and enforce the quantity/pinga arithmetic and total
  score delta for its `drinkTotals` projection.

## Logging & Audit

- Every admin action must emit an events doc (ts, actorUid, type, delta, teamId).
- Drink scoring receipts add `schemaVersion: 2` and immutable item snapshots:
  `drinkId`, `drinkName`, `pingaValue`, `quantity`, and `lineDelta`.
