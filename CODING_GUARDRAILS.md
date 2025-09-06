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

- Services: unit tests (Vitest), mock emulator or SDK against emulator.
- Components: React Testing Library; test behavior, not implementation details.
- Rules: Firestore emulator tests for read/write invariants.
- E2E: Playwright smoke (view leaderboard; admin adds pinga; event recorded).

## Services Layer Enforcement

- UI layers (components/pages) must not import `firebase/firestore` directly.
  - Quick check:

    ```bash
    git grep "from 'firebase/firestore'" src/components src/pages
    # → should return 0 results
    ```

- All data access lives in `src/services/`.
  - `src/services/leaderboard.js`
    - `getLeaderboard(): Promise<Array<{id:string,name:string,pingas:number}>>`
    - `observeLeaderboard(callback: (teams: Team[]) => void): () => void`
    - `addPinga(teamId: string, delta: number, actorUid?: string): Promise<void>`
    - `listEvents(limit?: number): Promise<Event[]>`

  - `src/services/teams.js`
    - `observeTeamsOrderedByName(callback: (teams: Team[]) => void): () => void`
    - `createTeamIfNotExists(name: string): Promise<void>`
    - `deleteTeam(teamId: string): Promise<void>`

- Unit tests for services live under `src/services/__tests__/`.

## Performance & DX

- Memoize heavy lists; consider react-window for large leaderboards.
- Keep bundle lean; analyze if size increases meaningfully.

## Review Checklist

- [ ] No Firestore imports in components/pages
- [ ] Types are precise; no `any` in public surfaces
- [ ] Errors handled (auth/network)
- [ ] Tests added/updated; all green locally
- [ ] Docs updated when behavior/config changes
