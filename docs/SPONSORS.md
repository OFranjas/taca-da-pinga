# Sponsors

Sponsor logos are managed from the admin panel and rendered in three places:

- Home page sponsor strip
- Mobile leaderboard strips above and below the table
- Desktop/display leaderboard side rails

For the tournament-ready build, the mobile/tablet sponsor strips are intentionally manual-only horizontal scrollers. Earlier auto-moving versions fought native iOS touch scrolling and snapped back after dragging, so avoid reintroducing JS-driven horizontal marquee behavior there until it can be handled by one shared, device-tested carousel controller.

Desktop and display side rails can auto-scroll vertically because they are presentation-first surfaces and do not compete with touch dragging in the main mobile flow.
