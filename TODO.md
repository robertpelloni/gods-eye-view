# Tactical Tasks & Granular Backlog (TODO)

## Immediate Bug Fixes & Stabilization
- [ ] Maintain consistent Node.js engine compatibility checks across all tools and CI runners.
- [ ] Ensure all dynamic imports in `server/providers/openai/` preserve rate limiting and error recovery semantics.
- [ ] Verify CCTV source catalogs handle intermittent upstream network outages gracefully without crashing worker threads.
- [ ] Audit all layer state token reservations in `src/data/layerStateTokenReservations.json` to prevent token collisions.

## Dashboard & UI Consolidation
- [ ] Unify scattered dashboard categories into consolidated, intuitive groupings (Tactical Operations, Movement & Assets, Optical & Sensors, Global Environment, Static Infrastructure, Utility Tools).
- [x] Provide clear descriptive tooltip markers (`title` and explanatory hints) on command dock and data layer panel headers.
- [ ] Condense sub-panel navigation into single-surface workflows to eliminate unnecessary nested modal layers.
- [ ] Enhance responsive mobile rail presentation to ensure effortless single-thumb access.

## Server & Environment Management
- [ ] Audit Pinokio background daemon runner (`pinokio/start.js` and `scripts/pinokio-start.mjs`) for clean process termination handling.
- [ ] Provide explicit graceful shutdown endpoints in local server mode to terminate active proxies cleanly.
- [ ] Add real-time proxy throughput telemetry to the developer diagnostics panel.
