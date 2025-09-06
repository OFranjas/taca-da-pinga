# 🏆 Taça da Pinga

> Real-time leaderboard app for a friendly football tournament — with beer points instead of goals 🍺

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)[![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)[![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)](https://recharts.org/)[![CSS Modules](https://img.shields.io/badge/CSS%20Modules-000000?style=for-the-badge&logo=css3&logoColor=white)](https://github.com/css-modules/css-modules)
![Firebase Hosting](https://img.shields.io/badge/Hosted%20on-Firebase%20Hosting-orange?style=for-the-badge&logo=firebase)

![Made with Love](https://img.shields.io/badge/Made%20with-%F0%9F%8D%BA%20and%20%F0%9F%92%9C-ff69b4?style=for-the-badge)

![CI](https://github.com/OFranjas/taca-da-pinga/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://cdn.prod.website-files.com/5e0f1144930a8bc8aace526c/65dd9eb5aaca434fac4f1c34_License-MIT-blue.svg)](/LICENSE)

A small web application built with **React** and **Firebase** to manage a fun "beer points" leaderboard for a local football tournament.  
Participants can see the leaderboard in real-time, and admins can add points (_pingas_) from a protected admin panel.

Originally developed in a couple of days as a request for a friend, this project also served as a hands-on opportunity to practice **React** development, **Firebase** integration, and responsive UI design.

🚀 <a href="https://taca-da-pinga.web.app/" target="_blank"><strong>Click here to view the live demo</strong></a> 🚀

---

## ✨ Features

- **Real-time Leaderboard** – Updates instantly as scores change.
- **Admin Panel** – Secure login for managing teams and adding points.
- **Responsive Design** – Optimized for desktop, TV display, and mobile.
- **Firebase Integration** – Authentication & Firestore database.
- **Sponsor Rail** – Displays tournament sponsors.

---

## 📸 Screenshots

### Leaderboard

| Desktop View                                              | Mobile View                                              |
| --------------------------------------------------------- | -------------------------------------------------------- |
| ![Leaderboard Screenshot](./docs/Leaderboard_Desktop.png) | ![Leaderboard Screenshot](./docs/Leaderboard_Mobile.png) |

### Admin

#### Add Pingas

| Desktop View                                      | Mobile View                               |
| ------------------------------------------------- | ----------------------------------------- |
| ![Add Pingas](./docs/Admin_AddPingas_Desktop.png) | ![Add Pingas](./docs/Admin_AddPingas.png) |

#### Manage Teams

| Desktop View                                          | Mobile View                                   |
| ----------------------------------------------------- | --------------------------------------------- |
| ![Manage Teams](./docs/Admin_ManageTeams_Desktop.png) | ![Manage Teams](./docs/Admin_ManageTeams.png) |

---

## 🚀 Getting Started

#### Prerequisites

- Node.js v18+
- npm (comes with Node)

#### Installation

```
# Clone the repository
git clone https://github.com/OFranjas/taca-da-pinga.git

# Install dependencies
npm install
```

#### Development

```
npm run dev
```

Runs the app in development mode (Vite) at http://localhost:5173 with HMR.

#### Build

```
npm run build
```

Builds the app for production to the `dist` folder (Vite). Use `npm run preview` to locally preview the production build.

## 🔀 Branching Model

- `feature/*` → short-lived feature branches, branched from `develop`
- `develop` → integration branch (feature PRs merge here)
- `production` → production-ready branch (protected)

### PR Rules

- Into `develop`: CI must be green.
- Into `production`: CI must be green **and** at least 1 approval from code owner.
- Required CI check name: **CI / Lint / Typecheck / Test / Build**

See [`AGENTS.md`](./AGENTS.md) for exact agent/developer workflows.

---

## Runbook

- Local dev: [docs/DEV.md](docs/DEV.md)
- Config/env: [docs/CONFIG.md](docs/CONFIG.md)
- Testing: [docs/TESTING.md](docs/TESTING.md)
- Release: [docs/RELEASE.md](docs/RELEASE.md)
- Security: [docs/SECURITY.md](docs/SECURITY.md)

## 📄 License

This project is licensed under the MIT License. Check the [LICENSE](./LICENSE) file for more details.

## ⚠️ Disclaimer

This project was created as a lightweight, fun leaderboard system for a friendly competition.
Some logos and assets are used for demonstration purposes only and may be subject to copyright or restricted use.
