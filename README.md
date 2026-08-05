# Taça da Pinga

A real-time tournament leaderboard for tracking drinks as pingas.

[Open the live site](https://taca-da-pinga.web.app/)

## What it does

- Shows a live public leaderboard.
- Shows the top-five gap to the team immediately above in leaderboard and TV modes.
- Lets authorised administrators score drinks, manage teams, sponsors and branding.
- Provides a dedicated display mode for a TV or shared screen.
- Runs on React, Firebase and Vite, with an installable PWA shell.

## Routes

| Route                 | Purpose                      |
| --------------------- | ---------------------------- |
| `/`                   | Tournament home              |
| `/leaderboard`        | Live leaderboard             |
| `/display` (or `/tv`) | TV and shared-screen display |
| `/admin`              | Admin operations             |
| `/admin/branding`     | Branding management          |

## Quick start

Requires Node.js 22.19.0 and Corepack.

```bash
corepack enable
yarn install
yarn dev
```

The app runs at <http://localhost:5173>. Use `yarn build` to create a production build and `yarn preview` to test it locally.

## Validation

```bash
yarn lint
yarn typecheck
yarn test:ci
yarn test:rules
yarn build
```

## Delivery

Feature branches merge into `develop`; production releases are promoted from `develop` to `production`. Pull requests publish a preview, merges to `develop` deploy to [develop-taca-da-pinga.web.app](https://develop-taca-da-pinga.web.app/), and merges to `production` deploy the production Firebase project.

## Documentation

- [Admin guide](docs/ADMIN.md)
- [Developer guide](docs/DEV.md)
- [Configuration](docs/CONFIG.md)
- [Testing](docs/TESTING.md)
- [Release and rollback](docs/RELEASE.md)
- [Security model](docs/SECURITY.md)

## License

[MIT](LICENSE)
