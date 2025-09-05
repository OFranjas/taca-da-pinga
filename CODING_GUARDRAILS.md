# CODING_GUARDRAILS.md

## Language & Style

- React (functional components), modern JS/TS; prefer TypeScript for new modules.
- CSS Modules for styles; avoid global CSS except for resets/tokens.
- Keep components pure; side-effects in hooks/services; no Firestore in UI.

## Project Structure

```
src/
components/ # UI only
pages/ # route entry points
services/ # Firestore/Auth I/O only
hooks/
lib/
```

## Testing Requirements

- Services: unit tests (Jest), mock emulator or SDK against emulator.
- Components: React Testing Library; test behavior, not implementation details.
- Rules: Firestore emulator tests for read/write invariants.
- E2E: Playwright smoke (view leaderboard; admin adds pinga; event recorded).

## Performance & DX

- Memoize heavy lists; consider react-window for large leaderboards.
- Keep bundle lean; analyze if size increases meaningfully.

## Review Checklist

- [ ] No Firestore imports in components/pages
- [ ] Types are precise; no `any` in public surfaces
- [ ] Errors handled (auth/network)
- [ ] Tests added/updated; all green locally
- [ ] Docs updated when behavior/config changes
