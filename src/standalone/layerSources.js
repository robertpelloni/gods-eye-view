import { createDirectionsSource } from '../layers/directions/source.js';
import { createRecentImagerySource } from '../layers/recentImagery/source.js';
import { createOpenFreeMapSource } from '../sources/openFreeMap.js';
import {
  createFlightSource,
  createMilitarySource,
  createVesselSource,
} from '../sources/live/standalone.js';
import { createCctvSource } from '../layers/cctv/source.js';
import { createRadioSource } from '../layers/radio/source.js';
import { createTransitSource } from '../layers/transit/source.js';
import { createTrafficSource } from '../layers/traffic/source.js';
import { createBikeshareSource } from '../layers/bikeshare/source.js';
import { createInstallationSource } from '../layers/installations/source.js';
import { createSatelliteSource } from '../layers/satellites/source.js';
import { createLaunchSource } from '../layers/launches/source.js';
import { createOverpassAlprSource } from '../layers/alpr/source.js';
import { createWindSource } from '../layers/wind/source.js';
import { createFirmsSource } from '../layers/firms/source.js';
import { createMapillarySource } from '../layers/streetLevel/providers/mapillary/source.js';
import { createReferenceSources } from '../sources/reference.js';
export { createReferenceSources as createStandaloneReferenceSources } from '../sources/reference.js';

/** Select standalone providers without starting their acquisition. */
export function createStandaloneLayerSources({
  createMapTiles = createOpenFreeMapSource,
} = {}) {
  // Each subsystem owns its own request lifetime and local result cache. The
  // sources still share the bounded decoded-tile owner inside OpenFreeMap.
  const trafficTiles = createMapTiles();
  const installationTiles = createMapTiles();
  return {
    ...createReferenceSources(),
    directions: createDirectionsSource(),
    'recent-imagery': createRecentImagerySource(),
    flights: createFlightSource(),
    military: createMilitarySource(),
    vessels: createVesselSource({
      apiUrl: import.meta.env?.VITE_AIS_LIVE_API_URL || '/api/vessels',
      // Resolved against the document's address, which a panel host may
      // serve from its own scheme.
      origin: () => globalThis.document?.baseURI ?? 'http://localhost',
    }),
    cctv: createCctvSource(),
    radio: createRadioSource(),
    traffic: createTrafficSource({ mapTiles: trafficTiles }),
    transit: createTransitSource(),
    bikeshare: createBikeshareSource(),
    installations: createInstallationSource({ mapTiles: installationTiles }),
    satellites: createSatelliteSource(),
    launches: createLaunchSource(),
    alpr: createAlprTileSource(),
    firms: createFirmsSource(),
    wind: createWindSource(),
  };
  for (const name of Object.keys(overrides)) {
    if (!Object.hasOwn(defaults, name))
      throw new TypeError(`Unknown source: ${name}`);
  }
  return { ...defaults, ...overrides };
}
