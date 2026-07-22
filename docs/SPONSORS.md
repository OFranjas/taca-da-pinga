# Sponsors

Sponsor logos are managed from the admin panel. Administrators can create,
edit, reorder, activate, deactivate and delete sponsor cards. Each card needs a
name, image data URL, active flag and an order from 0 to 999; its optional link
must use `https://`.

Active sponsor cards are rendered in three places:

- Home page sponsor strip
- Mobile leaderboard strip above the table
- Desktop/display leaderboard side rails

Mobile/tablet sponsor strips use a shared transform-based auto-scroll controller. It preserves horizontal dragging and touch swiping, pauses while a user hovers, focuses or touches the strip, resumes after a short idle delay, and disables movement when the device requests reduced motion. Keep this behaviour in `SponsorMarquee`; do not add page-specific carousels.

Desktop and display side rails can auto-scroll vertically because they are presentation-first surfaces and do not compete with touch dragging in the main mobile flow.

After changing sponsor content, check the home page, mobile leaderboard and
`/display`. Inactive sponsors are retained for administrators but are hidden
from every public placement.
