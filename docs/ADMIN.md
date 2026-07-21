# Tournament Admin Guide

## Access

The public leaderboard does not need a login. Administrative actions require a
Firebase Authentication account whose ID token has the custom claim
`admin: true`. A successful email/password login without that claim cannot
write tournament data.

For local claim-management instructions, see [DEV.md](DEV.md#admin-custom-claims).
After a claim changes, the administrator must sign out and back in to refresh
their Firebase ID token.

## Daily scoring

1. Sign in at `/admin`.
2. Select the team and the drink or drinks served.
3. Confirm the score. The app calculates the total number of pingas from the
   configured catalogue and records the drink breakdown with the score event.
4. Verify the team moves on the public leaderboard.

The current catalogue is maintained in `src/config/drinks.ts`. Its IDs are used
in historical score records, so do not rename or reuse an ID after it has been
scored. A single submission must add from 1 to 50 pingas.

## Managing teams

Use the **Manage teams** section in the admin panel to add a team before play
begins or remove one that was created by mistake. Team totals are protected by
Firestore rules: only admins can write, score totals cannot be reduced, and a
score increment is capped at 50 pingas.

## Managing sponsors

The admin panel can create, edit, reorder, activate, deactivate and remove
sponsors. A sponsor card needs a name, an image data URL and an order from 0 to
999; its optional destination must be an `https://` URL. Inactive sponsors stay
available to administrators but are not shown publicly.

## Sponsors and branding

- Use the sponsor management section to add, reorder, activate or deactivate
  sponsor cards. Sponsor links must use `https://` (or be empty).
- Use **Branding** to update the primary logo and app icon. Images are stored as
  image data URLs and are limited to 180 KB each.
- Check both the public leaderboard and `/display` after material sponsor or
  branding changes.

## Display mode

Open `/display` on the presentation device. It uses the same live leaderboard
data as the public route and is designed for a TV or shared screen. The admin
panel includes an **Abrir modo TV** shortcut that opens it in a new tab.

## Before the event

- Confirm every administrator can sign in and has the `admin: true` claim.
- Add the intended teams and verify the score flow with a low-value drink.
- Check the public leaderboard on mobile and the display route on the event
  screen.
- Confirm sponsor links, ordering and branding assets.
- Keep the production release and rollback procedure available: [RELEASE.md](RELEASE.md).
