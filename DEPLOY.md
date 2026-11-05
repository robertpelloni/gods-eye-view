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
Pinokio manages Node and dependency versions automatically:
1. Open the Pinokio desktop client.
2. Select **God's Eye View** repository.
3. Click **Install**, then **Start**.
Keys can be configured directly inside the application interface via **POWER UP → Provider Settings**.

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
