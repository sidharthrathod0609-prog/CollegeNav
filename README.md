<p align="center">
  <img src="public/favicon.svg" alt="CollegeNav Logo" width="72" height="72" />
</p>

<h1 align="center">CollegeNav</h1>

<p align="center">
  <strong>Intelligent College Bus Navigation System</strong><br/>
  Built for CVR College of Engineering — 54 Official Circular Transit Corridors
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Firebase-13.x-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Portals & Credentials](#-portals--credentials)
- [Project Structure](#-project-structure)
- [Route Dataset](#-route-dataset)
- [Firebase Integration](#-firebase-integration)
- [Testing](#-testing)
- [Tech Stack](#-tech-stack)
- [Known Limitations](#-known-limitations)

---

## 🚌 Overview

**CollegeNav** is a full-stack college transport management web application designed for **CVR College of Engineering (CVRCE), Hyderabad**. It provides an intelligent, real-time bus navigation experience for students, conductors, and transport administrators across **54 official circular transit corridors** serving the Hyderabad–Secunderabad region.

The application operates as a **Progressive Web App (PWA)**-ready single-page application with graceful offline fallback — all core features function without a live Firebase connection.

---

## ✨ Features

### 🎓 Student Interface

| Feature | Description |
|---|---|
| **Smart Route Search** | Origin → destination search with AI-powered recommendations across all 54 corridors |
| **Route Cards** | Detailed journey cards with fare, stops, timing, and seat availability |
| **Interactive Map** | OpenStreetMap / Leaflet route visualisation with custom stop markers |
| **Service Alerts** | Live transport advisories with severity colour-coding |
| **Boarding Requests** | Request a seat on any route; receive a digital pass code on approval |
| **Route Details** | Full stop-by-stop breakdown in a slide-over modal |

### 🧑‍✈️ Conductor Portal

| Feature | Description |
|---|---|
| **Trip Management** | View assigned trips and live passenger lists |
| **Seat Approval** | Accept or reject student boarding requests with one tap |
| **Occupancy Tracking** | Mark passengers as boarded; real-time seat count update |
| **Stale-Data Detection** | Headcount older than 25 minutes flagged as stale |
| **Overbooking Guard** | Bus capacity enforced atomically — final seat cannot be double-booked |

### 🛡️ Admin Transport Portal

| Feature | Description |
|---|---|
| **Command Centre Dashboard** | Fleet summary, route health, boarding overview in one view |
| **Route Administration** | Edit schedules, stops, fares, and conductors for all 54 routes |
| **Stop Reordering** | Drag-style reordering with boundary protection |
| **Service Advisories** | Full CRUD — publish, update, resolve, and delete alerts |
| **Boarding Oversight** | Supervisory approve / decline with official reason compliance |
| **Privacy Guard** | Contact numbers blocked from all data fields automatically |
| **Security Diagnostics** | Honest Firebase connection state reporting |
| **Reset to Defaults** | One-click restore of all 54 official circular routes |

---

## 🏗️ Architecture

```
CollegeNav
├── Student SPA (React + Leaflet)         ← Public-facing passenger interface
│   ├── Route Search & Recommendations    ← src/utils/recommendations.ts
│   ├── Interactive Map                   ← src/components/InteractiveMap.tsx
│   └── Boarding Request Flow             ← src/components/StudentBoardingModal.tsx
│
├── Conductor Portal (Modal, passkey-gated)
│   └── src/components/ConductorPortalModal.tsx
│
├── Admin Portal (Modal, passkey-gated)
│   └── src/components/AdminPortalModal.tsx
│
├── Services Layer (singleton, in-memory + localStorage + Firebase RTDB)
│   ├── boardingService.ts                ← Atomic seat reservation engine
│   ├── transportDataService.ts           ← Route & advisory management
│   ├── firebaseConfig.ts                 ← RTDB connection with offline fallback
│   └── realtimeTracker.ts                ← GPS tracking hooks (Phase 4C ready)
│
└── Data Layer
    ├── cvrRoutes.ts                      ← 54 official CVRCE circular corridors
    └── geoCoordinates.ts                 ← Stop lat/lng registry
```

### State Persistence Priority

```
Firebase RTDB  →  (fallback)  →  localStorage  →  (fallback)  →  In-memory defaults
```

All writes are attempted on Firebase first; on failure, data is preserved in `localStorage` so the app functions seamlessly offline.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-org>/CollegeNav.git
cd CollegeNav

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

Build output is placed in `dist/`. Preview it with:

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 🔑 Portals & Credentials

> **These are demo / development credentials.** Change them before any production deployment.

### Admin Transport Portal

| Field | Value |
|---|---|
| **Access via** | Click the 🛡️ **Admin** button in the page header |
| **Passkey** | `CVR-TRANS-2026` |

### Conductor Portal

| Field | Value |
|---|---|
| **Access via** | Click the 🧑‍✈️ **Conductor** button in the page header |
| **General Passkey** | `CVR-CONDUCTOR-2026` |
| **Route-specific key** | `CVR-COND-R{routeNumber}` (e.g. `CVR-COND-R15` for Route 15) |

> Route-specific passkeys allow conductors to manage only their assigned route, preventing cross-route data access.

---

## 📂 Project Structure

```
CollegeNav/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/              # Static images and icons
│   ├── components/
│   │   ├── AdminPortalModal.tsx        # 6-tab admin command centre
│   │   ├── ConductorPortalModal.tsx    # Conductor trip management
│   │   ├── DemoNoticeBanner.tsx        # System info ribbon
│   │   ├── EmptyState.tsx              # No-results state
│   │   ├── Header.tsx                  # Top navigation
│   │   ├── InteractiveMap.tsx          # Leaflet route map
│   │   ├── RouteCard.tsx               # Search result card
│   │   ├── RouteDetailsModal.tsx       # Full stop-by-stop view
│   │   ├── SearchBar.tsx               # Smart search + swap
│   │   ├── ServiceAlertsSection.tsx    # Advisory feed
│   │   └── StudentBoardingModal.tsx    # Seat request form
│   ├── data/
│   │   ├── cvrRoutes.ts                # 54 official circular routes
│   │   └── mockRoutes.ts               # Dev/test mock data
│   ├── services/
│   │   ├── boardingService.ts          # Atomic boarding logic
│   │   ├── firebaseConfig.ts           # RTDB config + offline fallback
│   │   ├── realtimeTracker.ts          # GPS tracker (Phase 4C stub)
│   │   └── transportDataService.ts     # Route & advisory CRUD
│   ├── types/
│   │   ├── boarding.ts                 # Boarding request types
│   │   └── transit.ts                  # Route & stop types
│   ├── utils/
│   │   ├── geoCoordinates.ts           # Stop coordinate registry
│   │   └── recommendations.ts          # Search ranking algorithm
│   ├── App.tsx                         # Root component & routing
│   ├── index.css                       # Global + Leaflet overrides
│   └── main.tsx                        # React 19 entry point
├── tests/
│   ├── phase4a_tests.cjs               # Core route & auth tests  (6 suites)
│   ├── phase4b_tests.cjs               # Boarding request tests   (10 suites)
│   ├── phase4b1_tests.cjs              # Admin portal hardening   (10 suites)
│   └── phase4b2_tests.cjs              # Command centre tests     (10 suites)
├── database.rules.json                 # Firebase RTDB security rules
├── .env.example                        # Environment variable template
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗺️ Route Dataset

CollegeNav ships with **54 official CVRCE circular bus routes** covering major commuter corridors in Hyderabad and Secunderabad:

| Zone | Example Corridors |
|---|---|
| **East Hyderabad** | Uppal, LB Nagar, Kothapet, Dilsukhnagar |
| **North Hyderabad** | Kompally, Medchal, Alwal, Secunderabad |
| **West Hyderabad** | HITEC City, Miyapur, Kukatpally, Lingampally |
| **Central** | Ameerpet, Mehdipatnam, Malakpet |
| **South** | Shamshabad, Rajendranagar, Attapur |

All routes are **circular** — each bus originates from CVRCE campus and returns after completing the corridor loop.

---

## 🔥 Firebase Integration

CollegeNav is designed to work with **Firebase Realtime Database (RTDB)** for:
- Real-time boarding request sync across conductor and admin devices
- Route and advisory persistence
- Atomic seat reservation transactions

### Setup (Optional — app works offline without this)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Realtime Database** and copy your project config.
3. Copy `.env.example` to `.env` and fill in your credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Deploy security rules to Firebase:

```bash
firebase deploy --only database
```

The `database.rules.json` file contains production-ready RTDB security rules.

> **Without Firebase configured**, the app falls back gracefully to `localStorage`-backed persistence. All features remain fully functional in this offline-verified mode.

---

## 🧪 Testing

CollegeNav has **36 automated test cases** across 4 test suites covering the complete backend logic layer:

```bash
# Run all test suites
node tests/phase4a_tests.cjs    # 6 core auth & route tests
node tests/phase4b_tests.cjs    # 10 smart boarding tests
node tests/phase4b1_tests.cjs   # 10 admin portal hardening tests
node tests/phase4b2_tests.cjs   # 10 command centre tests
```

### Test Coverage Summary

| Suite | Tests | Coverage Area |
|---|---|---|
| `phase4a_tests` | 6 / 6 ✅ | Route data integrity, passkey auth, privacy guard |
| `phase4b_tests` | 10 / 10 ✅ | Boarding requests, capacity protection, concurrency, cancellation |
| `phase4b1_tests` | 10 / 10 ✅ | Admin mutations, advisory lifecycle, fleet math, security diagnostics |
| `phase4b2_tests` | 10 / 10 ✅ | Schedule validation, stop reordering, supervisory boarding, connection reporting |
| **Total** | **36 / 36** | ✅ **All passing** |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React 19 |
| **Language** | TypeScript 6.0 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Maps** | Leaflet 1.9 + OpenStreetMap tiles |
| **Icons** | Lucide React |
| **Backend / DB** | Firebase Realtime Database 13 |
| **Linter** | Oxlint |
| **Testing** | Node.js CJS test scripts (no test framework dependency) |

---

## ⚠️ Known Limitations

| Area | Detail |
|---|---|
| **GPS Tracking** | Phase 4C stub exists (`realtimeTracker.ts`) but live bus GPS is not yet connected. |
| **Authentication** | Portals are passkey-protected (shared secret), not individual user accounts. Upgrade to Firebase Auth for production. |
| **Passkeys** | Demo passkeys (`CVR-TRANS-2026`, `CVR-CONDUCTOR-2026`) are hardcoded. Rotate before any public deployment. |
| **Offline Sync** | Data written offline (`localStorage`) is not automatically synced back to Firebase when connectivity is restored. |
| **Bundle Size** | Production bundle is ~828 KB (gzip: 225 KB). Code-split the Admin and Conductor portals in a future phase for faster initial load. |

---

## 📄 License

This project was built as an academic capstone for **CVR College of Engineering, Hyderabad**.  
All route data, corridor names, and institutional references belong to CVRCE.

---

<p align="center">
  Built with ❤️ for CVRCE students and staff &nbsp;·&nbsp; <strong>CollegeNav v0.0.0</strong>
</p>
