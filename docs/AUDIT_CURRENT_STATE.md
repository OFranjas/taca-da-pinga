# Current State Audit

## Summary

The deployed app is usable for public leaderboard viewing, and the current admin account provided for validation successfully reaches the admin UI on both production and develop. Develop is visually and functionally ahead of production: it has the newer mobile-first layout, richer home page, improved admin/login presentation, and a more TV-oriented leaderboard. Production still serves an older UI.

Highest-priority items before treating the current deployment as production-ready: fix PWA manifest icon paths and service worker/offline behavior, resolve the current `yarn typecheck` failures, decide whether the production/develop UI drift is intentional, and verify whether develop is isolated from production before any develop admin mutation testing.

## Environments Audited

| Environment | URL                                    | Routes                        | Date       | Browser/tools                                      | Viewports                              |
| ----------- | -------------------------------------- | ----------------------------- | ---------- | -------------------------------------------------- | -------------------------------------- |
| Production  | https://taca-da-pinga.web.app/         | `/`, `/leaderboard`, `/admin` | 2026-05-31 | Browser plugin, Playwright Firefox 150.0.2 capture | 390x844, 768x1024, 1440x900, 1920x1080 |
| Develop     | https://develop-taca-da-pinga.web.app/ | `/`, `/leaderboard`, `/admin` | 2026-05-31 | Browser plugin, Playwright Firefox 150.0.2 capture | 390x844, 768x1024, 1440x900, 1920x1080 |

Screenshots were captured under `output/audit-current-state/`, including one PNG per environment/route/viewport plus authenticated admin screenshots. Representative examples:

| Area                               | Screenshot                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Production home mobile             | [prod-home-mobile.png](../output/audit-current-state/prod-home-mobile.png)                               |
| Production leaderboard TV          | [prod-leaderboard-tv.png](../output/audit-current-state/prod-leaderboard-tv.png)                         |
| Production admin logged-in mobile  | [prod-admin-logged-in-mobile.png](../output/audit-current-state/prod-admin-logged-in-mobile.png)         |
| Production admin logged-in desktop | [prod-admin-logged-in-desktop.png](../output/audit-current-state/prod-admin-logged-in-desktop.png)       |
| Develop home mobile                | [develop-home-mobile.png](../output/audit-current-state/develop-home-mobile.png)                         |
| Develop leaderboard TV             | [develop-leaderboard-tv.png](../output/audit-current-state/develop-leaderboard-tv.png)                   |
| Develop admin logged-in mobile     | [develop-admin-logged-in-mobile.png](../output/audit-current-state/develop-admin-logged-in-mobile.png)   |
| Develop admin logged-in desktop    | [develop-admin-logged-in-desktop.png](../output/audit-current-state/develop-admin-logged-in-desktop.png) |
| Develop offline reload             | [develop-offline-leaderboard.png](../output/audit-current-state/develop-offline-leaderboard.png)         |

## Core User Journeys

- Public home: production loads a simple centered card; develop loads the newer branded hero and sponsor section. Both are navigable on mobile.
- Public leaderboard: both environments load without console errors online. Develop has better hierarchy, totals, and card-based rows; production is denser but feels less polished.
- Admin login: current admin account provided for validation successfully reaches the admin UI on both production and develop.
- Add pingas: UI was inspected after login, but no add action was submitted. Production mutations are out of scope, and develop mutations were treated as unsafe because develop could not be proven isolated from production.
- Manage teams: UI was inspected after login, but create/delete actions were not submitted for the same safety reason.

No production data mutations were attempted. Develop create/add/delete was skipped because previous deployed request inspection showed both environments using `projects/taca-da-pinga/databases/(default)`, and this audit did not prove isolation. The previous test account `testing@tests.com` remains disabled with Firebase Auth `USER_DISABLED`, but it is no longer the primary blocker because the current admin account works.

## Mobile Findings

### P1

- Production and develop both use the same Firebase project in observed Firestore requests: `projects/taca-da-pinga/databases/(default)`. If develop is intended to be isolated from production data, this is a release risk and blocks safe mutation testing on develop.
- Production mobile leaderboard spends the first viewport on sponsor cards before the actual ranking starts. Users landing on `/leaderboard` at 390x844 must scroll before seeing the leaderboard title and standings.
- Production mobile admin after login is compact and efficient, but it has placeholder-only search input and a very small native number input between large `-` and `+` controls.

### P2

- Production mobile home has a large blank vertical band before the primary card, making the first screen feel sparse.
- Production mobile header hides the text brand and leaves only the logo plus nav actions; this is functional but less explicit than develop.
- Develop mobile admin is visually strong, but the authenticated "Adicionar Pingas" panel starts low enough that the primary submit button is partially below the first 390x844 viewport. Frequent admins must scroll before completing the default task.
- Develop mobile admin's "Menu" button is clear but behaves like a section selector; consider a more explicit label if admins use it under event pressure.

## TV Leaderboard Findings

### P1

- Develop TV display is polished and readable, but only about 6 full leaderboard rows are visible at 1920x1080 because each row is large. For a real TV display, consider a display mode that prioritizes more standings, auto-scroll, or rotating sponsor/leaderboard regions.
- Production TV display is dense enough to show more rows, but it lacks the richer totals/status metadata present in develop and feels less purpose-built for a public display.

### P2

- Sponsor rails render cleanly on TV in both environments. Develop spacing and card treatment are materially better.
- Neither environment exposes an obvious fullscreen/display route that hides navigation chrome for a venue TV.

## PWA Findings

- Manifest exists at `/manifest.json` and returns 200.
- Manifest icon paths are broken for installability: it references `icon-192.png` and `icon-512.png`, while the repo and deployed static assets use `logo192.png` and `logo512.png`.
- Because Firebase Hosting rewrites unknown paths to `index.html`, `/icon-192.png` returns HTTP 200 with `content-type: text/html; charset=utf-8`, not an image. This is especially subtle because it is not a normal 404.
- `/logo192.png` returns HTTP 200 with `content-type: image/png`.
- No service worker registration was found in the repo, and `/service-worker.js` also resolves to the app HTML through the hosting rewrite.
- Offline reload on develop did not provide a proper offline fallback. The app shell stayed visible in the current browser session, but Firestore data fell back to an empty leaderboard and logged backend connectivity errors.
- Theme color is configured as `#ffffff` in both `public/index.html` and `public/manifest.json`.

## Accessibility Findings

- Production admin login fields rely on placeholders and do not show visible field labels.
- Develop admin login has visible labels for email and password.
- Most primary buttons observed on mobile meet expected touch target sizing.
- Authenticated production admin uses large touch targets for section tabs and submit actions, but the number input itself is narrow and partly dependent on browser-native steppers.
- Authenticated develop admin has strong visible labels and hierarchy. The mobile layout is readable, but the primary add-pingas action sits below the initial viewport.
- Leaderboard rows use semantic table roles in the local repo, which is good for assistive technology.
- Keyboard/focus behavior was partially validated through browser form submission and visible focusable-control inspection. Full manual keyboard traversal on a physical keyboard remains a recommended human validation pass.

## Performance / Loading Findings

- Online route loads completed without console warnings/errors across the 24 route/viewport captures.
- `yarn build` reports a large chunk warning: `dist/assets/index-Bshku7rH.js` is 793.09 kB minified, 213.98 kB gzip.
- The production deployed build is older/smaller visually, but develop has more images and richer layout. Sponsor images dominate visual weight on leaderboard routes.
- `yarn test:ci` passed, but `LeaderboardPage` tests emitted Firestore name-resolution warnings, which suggests some test paths still touch real Firestore instead of a pure mock.

## Console / Network Errors

Online route/viewport sweep:

- Production `/`, `/leaderboard`, `/admin`: 0 console errors and 0 warnings in captured Playwright console output.
- Develop `/`, `/leaderboard`, `/admin`: 0 console errors and 0 warnings in captured Playwright console output.

Admin login:

- Current admin account: authenticated admin UI reached on production and develop at mobile and desktop sizes. No credentials are included in this document or screenshots.
- Previous test account `testing@tests.com`: still returns Firebase Auth `USER_DISABLED`. Exact response captured during the earlier pass:

```json
{
  "error": {
    "code": 400,
    "message": "USER_DISABLED",
    "errors": [
      {
        "message": "USER_DISABLED",
        "domain": "global",
        "reason": "invalid"
      }
    ]
  }
}
```

Offline develop reload:

- `@firebase/firestore: Firestore (11.10.0): WebChannelConnection RPC 'Listen' stream ... transport errored.`
- `@firebase/firestore: Firestore (11.10.0): Could not reach Cloud Firestore backend. Connection failed 1 times. Most recent error: FirebaseError: [code=unavailable]: The operation could not be completed`
- Browser also reported CORS/network failures for Firestore Listen channel requests while offline.

## Prod vs Develop Differences

| Route          | Difference                                                                                                                                                         | Severity                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `/`            | Production has the older simple card home page; develop has the newer branded hero, explanatory copy, and sponsor section.                                         | P1 if production should already reflect develop |
| `/leaderboard` | Production uses an older dense list with sponsor cards first on mobile; develop uses a newer card/table layout with totals and stronger hierarchy.                 | P1                                              |
| `/admin`       | Production shows a compact older admin shell after login; develop shows the newer admin shell with hero panel, quick navigation, branding link, and sign-out copy. | P2                                              |
| Firebase data  | Develop Firestore requests observed against `projects/taca-da-pinga/databases/(default)`, same as production.                                                      | P1 if environment isolation is expected         |
| Branding       | Production header/home uses crest branding; develop uses beer icon branding.                                                                                       | P2 or intentional                               |

## Local Verification Results

| Command                                  | Result                    | Notes                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack enable`                        | Pass                      | No output.                                                                                                                                                                                                  |
| `corepack prepare yarn@4.3.1 --activate` | Pass                      | Prepared Yarn 4.3.1.                                                                                                                                                                                        |
| `yarn install --immutable`               | Pass                      | Rebuilt cached packages; generated install-state change was reverted to keep PR audit-only.                                                                                                                 |
| `yarn lint`                              | Pass                      | No warnings.                                                                                                                                                                                                |
| `yarn typecheck`                         | Fail                      | `src/pages/AdminShell.tsx(132,44)` and `(141,42)`: `"xs"` not assignable to `StackGap`; `src/services/sponsors.service.ts(39,22)`: `QueryFieldFilterConstraint` not assignable to `QueryOrderByConstraint`. |
| `yarn test:ci`                           | Pass                      | 14 files, 60 tests passed. Firestore network warnings appeared in `LeaderboardPage` tests.                                                                                                                  |
| `yarn test:rules`                        | Pass after elevated rerun | First attempt failed because sandbox blocked emulator port binding. Elevated rerun passed: 1 file, 8 tests. `npm audit` reported 6 vulnerabilities in `rules-tests` install output.                         |
| `yarn build`                             | Pass                      | Build succeeded with chunk warning for 793.09 kB minified JS bundle.                                                                                                                                        |

## Recommended Next Issues

### P0 must fix

- None observed that fully blocks public leaderboard viewing.

### P1 should fix before production

- Fix current `yarn typecheck` failures.
- Fix PWA manifest icon paths and add a real service worker/offline strategy if PWA install/offline support is a product requirement.
- Confirm whether develop should point at the production Firebase project. If not, separate Firebase config/data for develop before validating admin mutation flows.
- Decide whether the production/develop visual drift is intentional; if develop is the intended release candidate, promote it through the normal release path.
- Add safe seeded test data or a non-production Firebase project so add-pingas/create/delete flows can be validated without risking production data.

### P2 later polish

- Add a TV/display route or mode with no nav chrome, more visible standings, and optional auto-scroll/rotation.
- Improve production mobile leaderboard entry by moving standings above sponsor cards or reducing sponsor height on first viewport.
- Add visible labels to production admin login fields.
- Reduce bundle size with route-level code splitting and image optimization, especially large logo/sponsor assets.
- Add a real-phone and real-TV human validation pass for tap feel, viewing distance, brightness, and venue readability.
