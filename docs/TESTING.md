# Testing Strategy

## Pyramid

- Unit: services/hooks
- Component: RTL
- Rules: Firestore emulator
- E2E: Playwright (smoke)

## Commands

```bash
npm test -- --watch=false
npm run test:rules
npm run e2e
```

## Firestore Rule Invariants

- Public READ for leaderboard and events

- Admin-only WRITE to leaderboard, events, app_config

- Positive bounded increments for "add pinga" (e.g., 1..5)
