# Autonomous Engineering Session Handoff (HANDOFF.md)

## 1. Executive Summary & Context Snapshot
- **Autopilot Cycle**: Protocol #268 autonomous execution.
- **Base Version**: `0.2.0-sovereign.1` (Build 1480), referencing `VERSION.md`.
- **Target Platform**: Sovereign Awareness Platform (God's Eye View) with personal sensor fusion and course infrastructure.
- **Current Operational Status**: Live simulator and real-time processing engine ready. UI accessibility tooltips and Pinokio zero-config deployment fully integrated.

## 2. Structural Shifts & Architectural Observations
- **Branch and Git State**:
  - The repository has `origin` pointing to `https://github.com/robertpelloni/gods-eye-view`. No external `upstream` remote was found.
  - Submodules status confirmed clean (no dangling submodules).
  - Recent merge commits merged features such as `hal-646-zh-tw`, `fix-cctv-session-admission`, `mobile-4d-world-app`, and `course launch checklist`.
- **Environment & Engine Invariants**:
  - The project package.json specifies Node engines `>=24.14.0 <25 || >=26 <27`.
  - In environments running Node v22, `npm run doctor` flags this appropriately. Ensure Node 24 is used when running GC-calibrated allocation benchmark tests (`src/data/focusAllocations.test.mjs`, `src/overlays/worldOverlayAllocation.test.mjs`).
  - Unit tests for display controls and panel rails (`src/ui/displayControls.test.mjs`, `src/ui/panelRails.test.mjs`) pass 42/42 tests cleanly.
- **Package Boundaries Invariant**:
  - Package module ownership and import boundaries are strictly enforced via `scripts/check-package-boundaries.mjs` and `scripts/check-import-directions.mjs` against `scripts/package-boundaries.json`.
  - Avoid modifying `package.json` dependencies or cross-package exports unless boundary definitions are deliberately updated and tested.

## 3. Governance Files Established
- `VERSION.md`: Single source of truth for version and build tracking.
- `ROADMAP.md`: Four-phase roadmap covering sensor fusion, HAL, wearable/implant hubs, and edge deployment.
- `TODO.md`: Granular tactical tracker for bugs and UI consolidation.
- `VISION.md`: Platform vision on sovereign omniscience, ethical boundaries, and local-first execution.
- `MEMORY.md`: Architectural traits, state invariants, and proxy pipelines.
- `DEPLOY.md`: Deployment workflows across native, Docker, Pinokio hermetic Node 24 runtime, and LAN proxies.
- `IDEAS.md`: Research proposals for WebGPU point clouds, mesh telemetry, and AR glass integration.
- `CHANGELOG.md`: Detailed record of changes tagged against v0.2.0.

## 4. Immediate Guidance for Successor Agents
- **Real-Time AI & Satellite Telemetry**: The platform is prepared to ingest orbital ephemeris, AIS vessel tracking, and ADS-B flight data into the 3D CesiumJS scene.
- **UI Tooltips & i18n**: When modifying dashboard templates, ensure strings are translated or marked with `data-i18n`, `data-i18n-title`, or `data-i18n-aria-label` to maintain compatibility with `scripts/i18n.mjs`.
- **Testing Standard**: Always verify changes against individual targeted test suites (`node --test <test_path>`) before invoking broader runners to prevent session timeouts.
