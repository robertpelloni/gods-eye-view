# Deployment & Environment Configuration Guide (DEPLOY.md)

This document provides deployment guidelines across native terminal, Docker Compose, Pinokio, and edge environments.

---

## 1. Native Local Environment
### Prerequisites
- **Node.js**: Recommended Node.js 24.x (`>=24.14.0`) or 26.x.
- **npm**: 10.x or 11.x.

### Installation & Run
```bash
# Install exact dependencies
npm ci

# Verify environment readiness
npm run doctor

# Start Vite dev server on port 4173
npm run dev
```
Navigate to `http://localhost:4173`.

---

## 2. Docker & Containerized Deployment
Docker Compose isolates the Node environment and mounts local cache volumes:
```bash
# Build and bring up container
docker compose up -d

# Check real-time service logs
docker compose logs -f

# Graceful stop
docker compose down
```
Mounted persistent directories:
- `.env`: API credentials and runtime flags.
- `.gev-cache/`: Map and satellite tile caches.
- `.gev-logs/`: Process output logs.

---

## 3. Pinokio Single-Click Launcher
Pinokio provides a fully automated, sandboxed, and zero-configuration environment designed for seamless non-technical setup and sovereign local execution.

### Advantages of Pinokio Deployment
- **Hermetic Runtime Isolation**: Pinokio downloads and pins an exact standalone Node engine (v24 LTS) without contaminating host PATH or conflicting with system Node installs.
- **Automated Lifecycle Scripting**:
  - `install.js`: Validates disk permissions, runs dependency installation with production deduplication, and sets `.installed` marker.
  - `start.js`: Launches Vite and local proxy daemons, automatically acquiring an ephemeral localhost port if default `4173` is occupied.
  - `update.js`: Inspects incoming upstream commits with visual diffstat before pulling; prevents unexpected breaking updates.
  - `reset.js`: Clean repair sequence that flushes corrupt node_modules or invalid build caches without losing user `.env` secrets.
- **Out-of-the-Box Keyless Boot**: Automatically launches into live satellite imagery (Esri World Imagery) and keyless 3D terrain with zero API keys required.
- **Integrated Secret Governance**: API keys (OpenAI Realtime, Google Places, Cesium Ion) can be safely added via **POWER UP → Provider Settings** without editing filesystem configuration.

---

## 4. LAN Sharing & Reverse Proxy Configuration
- By default, the application binds strictly to loopback (`127.0.0.1`).
- To share across a secure local network:
  ```bash
  npm run dev -- --host 0.0.0.0 --port 4173
  ```
- If hosting behind a reverse proxy (e.g., Nginx, Caddy), set allowed hosts in `.env`:
  ```bash
  GEV_ALLOWED_HOSTS=globe.lan,osint.local
  GEV_KEY_SETUP_TRUSTED_PEERS=none
  ```
