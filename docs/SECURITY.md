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
    match /leaderboard/{teamId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /app_config/{docId} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Invariants

- Only admins can mutate.

- “Add pinga” increments are positive and bounded.

- Totals never negative.

## Logging & Audit

- Every admin action must emit an events doc (ts, actorUid, type, delta, teamId).
