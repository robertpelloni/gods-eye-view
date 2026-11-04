# Codebase Architectural Memory & Conventions (MEMORY.md)

## System Architecture Overview
The God's Eye View architecture follows a clean local-first pipeline divided across three primary runtime tiers:

1. **Client Engine (`src/`)**:
   - **Framework-less Core**: Vanilla modern ES Modules built on CesiumJS and Vite.
   - **Rendering & Orientation (`src/data/iconOrientation.js`)**: Calculates per-frame true screen-space headings projected across arbitrary camera angles to prevent entity tumbling or distortion.
   - **Dead Reckoning & Interpolation**: Smoothly predicts positions across 15–30s polling intervals to produce fluid 60fps entity movement.
   - **Visual HUD & Shaders (`src/ui/`, `src/bloom.js`)**: Implements hardware-accelerated post-processing effects and heads-up tactical overlays.

2. **Server Middleware & Security Proxies (`server/`)**:
   - **Credential Sandboxing**: API keys (OpenAI, AISStream, OpenSky, TomTom) remain server-side. The client receives short-lived ephemeral tokens or proxies requests through local endpoints.
   - **Rate Limiting & SSRF Defense**: Enforces per-IP limits (`server/providers/common/rate-limit.js`) and validates origins using strict same-site gating (`server/providers/common/same-site.js`).
   - **Provider Integrations**: Dedicated modules under `server/providers/` for ADS-B, OpenSky, CelesTrak, FIRMS, Overpass, and CCTV streams.

3. **Standalone & Launcher Shells (`pinokio/`, `mobile/`, `tools/`)**:
   - **Pinokio Shell**: Self-contained single-click launch script using `pinokio/start.js` and `scripts/pinokio-start.mjs`. Binds to `127.0.0.1` and manages process life cycle.
   - **Mobile Web App (`mobile/`)**: Touch-optimized 4D mobile layout with gesture navigation and phone virtual camera (VCAM) controls.

## Key Invariants & Rules
- **No Direct Mutation of Build Artifacts**: Always edit sources in `src/`, `server/`, `scripts/`, or `ui/templates/`. Never touch files in `dist/`.
- **Layer State Tokens**: Every layer must have a unique character token registered in `src/data/layerState.js` and reserved in `src/data/layerStateTokenReservations.json`.
- **Cross-Boundary Enforcement**: Enforced strictly via `scripts/check-package-boundaries.mjs` and `scripts/check-import-directions.mjs`.
