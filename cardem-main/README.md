# 🏎️ Cardem - The Car & Bike Enthusiast Convoy Network

> **A Mobile-First Fullstack Platform (iOS & Android Compatible)** architected strictly following the [Fullstack Blueprint](../PROMPT_TO_FULLSTACK_BLUEPRINT.md).

Cardem connects car and motorcycle enthusiasts for real-time group drives, featuring synchronized map telemetry, non-interfering click-to-talk Walkie-Talkie audio, road hazard crowdsourcing, customizable garages, and group drive leaderboards.

---

## 🌟 Core Features

### 1. 🛰️ Real-Time Convoy Map HUD (Feature A)
* **High-Precision Telemetry Streaming**: Continuously streams GPS coordinates, vehicle speed, heading, and vehicle identity via Socket.io WebSockets.
* **Cockpit HUD Overlay**: Digital speedometer (KM/H & MPH toggleable), compass heading, and pack member indicators.
* **Custom Vehicle Map Pins**: Distinct markers differentiating between cars (🏎️) and motorcycles (🏍️) with driver names and live speeds.

### 2. 📻 Non-Interfering Push-to-Talk Walkie-Talkie (Feature B)
* **Non-Exclusive WebAudio Pipeline**: Uses non-blocking `AudioContext` mixing that **will not interrupt or pause background music/navigation** (Spotify, Apple Music, Waze).
* **Synthesized VHF/CB Squelch Tones**: Authentic radio squelch chirps upon transmitter engage and release.
* **Live Audio Waves & Active Speaker Indicators**: Visual pulsing rings and active driver transmission banners across the entire convoy.

### 3. 🏆 Drive Statistics & Dynamic Leaderboards (Feature C)
* **Top Speed Records**: Automatic peak speed capture via GPS during group drives.
* **Safest Driver Rating Algorithm (0–100%)**: Calculates smooth throttle modulation, penalizing harsh braking and erratic acceleration to reward disciplined convoy leadership.
* **Personal & Global Hall of Fame**: Individual drive logs and global rankings.

### 4. 🏎️ Driver Profile & Enthusiast Garage (Feature D)
* **Fleet Management**: Park multiple cars and motorcycles with make, model, year, horsepower, color, and performance modifications (exhausts, tunes, tyres).
* **Active Ride Toggle**: 1-tap "Set as Primary Convoy Ride" to broadcast your active machine during pack drives.
* **Cascading Purge Protection**: Complete GDPR-compliant account deletion that securely removes all telemetry and garage records.

### 5. 🚨 Road Hazard & Speed Trap Intelligence (Feature E)
* **1-Tap In-Cockpit Reporting**: Fast-access floating drawer with 8 hazard categories:
  - 👮 Police Traps & Mobile Radars
  - 📸 Fixed Instant Speed Cameras
  - ⏱️ Average Speed Check Zones
  - 🚧 Road Obstructions & Debris
  - ⛔ Full Road Closures
  - ⚠️ Active Lane Closures
  - 🚗 Traffic Jams & Standstills
  - 🚦 Red Light Cameras & Faulty Signals
* **Geospatial Proximity Queries**: MongoDB `2dsphere` spatial indexing with `$nearSphere` queries within a 15km perimeter of the drive route.
* **Crowdsourced Verification**: Drivers confirm active hazards or mark them as cleared.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Mobile** | React 18, Redux (Thunk), React Router v6, Leaflet Maps, Web Audio API |
| **Styling** | Cockpit Dark Carbon CSS, Glassmorphism, Neon Racing Accents, Safe-Area Mobile Dock |
| **Backend API** | Node.js, Express 5, Socket.io Real-Time Engine, Mongoose ODM |
| **Security & Auth** | Dual-Header JWT (`x-auth-token` & `Authorization: Bearer`), bcryptjs (salt 10) |
| **Testing** | Jest, Supertest Integration Suite |
| **Native Packaging**| Capacitor 6 (iOS & Android native build targets) |

---

## 🚀 Getting Started

### Prerequisites
* Node.js >= 18.0.0
* MongoDB (Local instance or MongoDB Atlas URI in `.env`)

### Installation
From the `cardem-main` directory:
```bash
# Install backend dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Development Mode (Concurrent Backend & Frontend)
```bash
npm run dev
```
* **API Server & Sockets**: `http://localhost:5000`
* **Mobile Client Web App**: `http://localhost:3000`

### Running the Integration Test Suite
```bash
npm test
```

### Packaging for iOS & Android
The mobile client is packaged using Capacitor:
```bash
cd client
npm run build

# Add native platforms
npx cap add ios
npx cap add android

# Sync assets
npx cap copy

# Open in Native IDEs
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

---

## 📁 Architecture Invariants Implemented

1. **Dual-Header Authentication**: Express middleware accepts both `x-auth-token` and `Authorization: Bearer <token>`.
2. **Safe CastError Handling**: `checkObjectId.js` middleware sanitizes 24-character hexadecimal MongoDB ObjectIDs, preventing unhandled 500 error leaks on malformed routes.
3. **Cascading Deletions**: Deleting an account purges profile data, garage vehicles, hazard reports, and telemetry sessions.
4. **Ownership Verification**: Route handlers ensure only convoy hosts can start/stop drives and only report authors can delete their hazard alerts.
