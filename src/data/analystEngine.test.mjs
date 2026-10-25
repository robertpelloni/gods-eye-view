import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnalystEngine, applyScope, haversineKm } from './analystEngine.js';
import { createAnnotationResolver } from '../annotations/resolver.js';
import { FEATURE_SOURCE_METHODS } from '../sources/featureSource.js';

// Stub world: a square "Texland" region, flights + ships + fires around it.
const TEXLAND = { name: 'Texland', ring: [[-100, 28], [-94, 28], [-94, 33], [-100, 33]] };
const FLIGHTS = [
  { id: 'SWA1', lat: 30.2, lon: -97.7, altitudeM: 11000, speedMps: 240, military: false, onGround: false, routeOrigin: 'AUS', routeDestination: 'LAX' },
  { id: 'RCH01', lat: 31.0, lon: -97.0, altitudeM: 13500, speedMps: 250, military: true, onGround: false, routeOrigin: null, routeDestination: null },
  { id: 'N123', lat: 45.0, lon: -122.0, altitudeM: 2000, speedMps: 80, military: false, onGround: false, routeOrigin: null, routeDestination: null },
  { id: 'GND1', lat: 30.19, lon: -97.66, altitudeM: 150, speedMps: 5, military: false, onGround: true, routeOrigin: null, routeDestination: null },
];
const SHIPS = [
  { id: 'EVERGIVEN', lat: 29.5, lon: -94.9, speedKts: 12, shipType: 'Cargo', destination: 'OAKLAND', navStatus: 'under way' },
  { id: 'SLOWBOAT', lat: 29.6, lon: -95.0, speedKts: 0.2, shipType: 'Tanker', destination: 'HOUSTON', navStatus: 'anchored' },
];
const FIRES = [
  { id: 'FIRE-1', lat: 30.5, lon: -98.2, frp: 1500 },
  { id: 'FIRE-2', lat: 30.6, lon: -98.1, frp: 90 },
  { id: 'FIRE-3', lat: 51.9, lon: -121.9, frp: 2400 },
];

function makeEngine() {
  return createAnalystEngine({
    getRecords: (key) => ({ flights: FLIGHTS, 'ais-live-vessels': SHIPS, 'local-firms': FIRES }[key] || []),
    resolveRegionRing: async (name) => (/texland/i.test(name) ? TEXLAND : null),
    getViewContext: () => ({ lat: 30.27, lon: -97.74, viewRadiusKm: 150 }),
  });
}

/** Same world, but Contacts is up with a subject far from the parked camera. */
function makeContactsEngine(subject) {
  return createAnalystEngine({
    getRecords: (key) => ({ flights: FLIGHTS, 'ais-live-vessels': SHIPS, 'local-firms': FIRES }[key] || []),
    resolveRegionRing: async (name) => (/texland/i.test(name) ? TEXLAND : null),
    // Parked far away, as a high-altitude camera often is.
    getViewContext: () => ({ lat: 45.0, lon: -122.0, viewRadiusKm: 150 }),
    getContextSubject: () => subject,
  });
}

test('analyst: a radius query centers on the active contact, not the parked camera', async () => {
  // Field case: the Contacts panel counted a contact-centred window while the
  // camera sat off-coast at 441 km, so "how many within 250 km" answered from
  // the camera and disagreed with what the operator could see.
  const subject = { lat: 30.2, lon: -97.7, label: 'SWA1' };
  const r = await makeContactsEngine(subject).query({
    layers: ['flights'],
    scope: { kind: 'radius', km: 250 },
    limit: 50,
  });
  assert.equal(r.ok, true);
  // Austin-area flights, not the Oregon one the camera is parked over.
  assert.equal(r.count, 3);
  assert.equal(r.centeredOn, 'SWA1', 'the answer names the centre it measured from');
  assert.ok(r.coverage.scope.includes('@SWA1'));
});

test('analyst: an explicit center still wins over the active contact', async () => {
  const subject = { lat: 30.2, lon: -97.7, label: 'SWA1' };
  const r = await makeContactsEngine(subject).query({
    layers: ['flights'],
    scope: { kind: 'radius', km: 250, center: { lat: 45.0, lon: -122.0 } },
    limit: 50,
  });
  assert.equal(r.count, 1, 'only the Oregon flight is within 250 km of the given center');
  assert.equal(r.centeredOn, undefined, 'an explicit center is not relabelled');
});

test('analyst: with Contacts off, radius still centers on the view', async () => {
  const r = await makeContactsEngine(null).query({
    layers: ['flights'],
    scope: { kind: 'radius', km: 250 },
    limit: 50,
  });
  assert.equal(r.count, 1, 'view-centred behaviour is unchanged outside Contacts');
  assert.equal(r.centeredOn, undefined);
  assert.equal(r.coverage.scope, 'radius:250km');
});

test('analyst: a subject without usable coordinates cannot lend its name to a camera-centred count', async () => {
  // The label is the only thing telling the operator WHICH centre produced the
  // number. A subject present but position-less fell back to the camera and
  // kept the contact's name on the answer, so a camera-centred count read as
  // contact-centred with nothing in the payload to catch it.
  const r = await makeContactsEngine({ lat: null, lon: null, label: 'SWA1' }).query({
    layers: ['flights'],
    scope: { kind: 'radius', km: 250 },
    limit: 50,
  });
  assert.equal(r.count, 1, 'the count is the camera-centred one it actually measured');
  assert.equal(r.centeredOn, undefined, 'and it must not claim a centre it did not use');
  assert.equal(r.coverage.scope, 'radius:250km');
  assert.equal(r.scopeLabel, 'within 250 km');
});

test('analyst: every scope names itself in words', async () => {
  // Rule 3 of the counting contract: a bare number is what made two honest
  // answers look like a contradiction, so each scope carries its own phrasing.
  const subject = { lat: 30.2, lon: -97.7, label: 'DYNO11' };
  const centred = await makeContactsEngine(subject).query({
    layers: ['flights'], scope: { kind: 'radius', km: 250 }, limit: 1,
  });
  assert.equal(centred.scopeLabel, 'within 250 km of DYNO11');

  const plainRadius = await makeContactsEngine(null).query({
    layers: ['flights'], scope: { kind: 'radius', km: 250 }, limit: 1,
  });
  assert.equal(plainRadius.scopeLabel, 'within 250 km');

  const inView = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'view' }, limit: 1,
  });
  assert.equal(inView.scopeLabel, 'in view');

  const region = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'region', name: 'Texland' }, limit: 1,
  });
  assert.equal(region.scopeLabel, 'over Texland');

  const anywhere = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'anywhere' }, limit: 1,
  });
  assert.equal(anywhere.scopeLabel, 'anywhere in the loaded data');
});

test('analyst: count flights over a region', async () => {
  const r = await makeEngine().query({ layers: ['flights'], scope: { kind: 'region', name: 'Texland' }, limit: 50 });
  assert.equal(r.ok, true);
  assert.equal(r.count, 3, 'Oregon flight excluded');
  assert.ok(r.coverage.scope.includes('Texland'));
});

test('analyst: region coverage identifies the source of the boundary used for counting', async () => {
  for (const source of ['natural-earth', 'bundled-admin', 'remote-boundary']) {
    const engine = createAnalystEngine({
      getRecords: () => FLIGHTS,
      resolveRegionRing: async () => ({ ...TEXLAND, source }),
    });
    const result = await engine.query({
      layers: ['flights'],
      scope: { kind: 'region', name: 'Texland' },
    });

    assert.equal(result.ok, true);
    assert.equal(result.count, 3, 'the boundary excludes the Oregon flight');
    assert.equal(result.coverage.scope, 'region:Texland');
    assert.equal(result.coverage.scopeSource, source);
  }
});

test('analyst: filter-only follow-ups retain the region source without resolving again', async () => {
  const lookups = [];
  const engine = createAnalystEngine({
    getRecords: () => FLIGHTS,
    resolveRegionRing: async (name) => {
      lookups.push(name);
      return { ...TEXLAND, source: 'natural-earth' };
    },
  });
  const first = await engine.query({
    layers: ['flights'],
    scope: { kind: 'region', name: 'Texland' },
  });
  const airborne = await engine.query({
    followUp: true,
    filters: [{ field: 'onGround', op: 'eq', value: false }],
  });
  const military = await engine.query({
    followUp: true,
    filters: [{ field: 'military', op: 'eq', value: true }],
  });

  assert.equal(first.count, 3);
  assert.equal(airborne.count, 2);
  assert.deepEqual(military.items.map((item) => item.id), ['RCH01']);
  for (const result of [first, airborne, military]) {
    assert.equal(result.coverage.scope, 'region:Texland');
    assert.equal(result.scopeLabel, 'over Texland');
    assert.equal(result.coverage.scopeSource, 'natural-earth');
  }
  assert.deepEqual(lookups, ['Texland']);
});

test('analyst: an explicit replacement region replaces retained provenance', async () => {
  const engine = createAnalystEngine({
    getRecords: () => FLIGHTS,
    resolveRegionRing: async (name) => name === 'Texland'
      ? { ...TEXLAND, source: 'natural-earth' }
      : {
        name,
        ring: [[-98, 30.5], [-96, 30.5], [-96, 31.5], [-98, 31.5]],
        source: 'remote-boundary',
      },
  });
  await engine.query({
    layers: ['flights'],
    scope: { kind: 'region', name: 'Texland' },
  });
  const replacement = await engine.query({
    followUp: true,
    scope: { kind: 'region', name: 'Northern Texland' },
  });
  const followUp = await engine.query({ followUp: true });

  for (const result of [replacement, followUp]) {
    assert.deepEqual(result.items.map((item) => item.id), ['RCH01']);
    assert.equal(result.coverage.scope, 'region:Northern Texland');
    assert.equal(result.coverage.scopeSource, 'remote-boundary');
  }
});

test('analyst: an explicit scope without provenance clears the retained region source', async () => {
  for (const scope of [
    { kind: 'anywhere' },
    { kind: 'view' },
    { kind: 'radius', km: 150 },
    { kind: 'region', name: 'Uncredited Texland' },
  ]) {
    const engine = createAnalystEngine({
      getRecords: () => FLIGHTS,
      resolveRegionRing: async (name) => ({
        ...TEXLAND,
        name,
        ...(name === 'Texland' ? { source: 'natural-earth' } : {}),
      }),
      getViewContext: () => ({ lat: 30.27, lon: -97.74, viewRadiusKm: 150 }),
    });
    const first = await engine.query({
      layers: ['flights'],
      scope: { kind: 'region', name: 'Texland' },
    });
    const replacement = await engine.query({ followUp: true, scope });
    const followUp = await engine.query({ followUp: true });

    assert.equal(first.coverage.scopeSource, 'natural-earth');
    for (const result of [replacement, followUp]) {
      assert.equal(result.ok, true, scope.kind);
      assert.equal(result.count, 3, scope.kind);
      assert.equal(Object.hasOwn(result.coverage, 'scopeSource'), false, scope.kind);
      assert.notEqual(result.coverage.scope, first.coverage.scope, scope.kind);
    }
  }
});

for (const [label, committedScope, scopeSource] of [
  ['replacement boundary source', 'region:Presented Texland', 'remote-boundary'],
  ['window without a boundary source', 'window:presented', null],
]) {
  test(`analyst: pre-commit displayed cohort retains ${label} and its feed provenance`, async () => {
    const committedSnapshot = {
      id: 'flights', enabled: true, feedState: 'stale',
      source: 'displayed-cohort-feed', lastUpdate: 1_800_000_000_000,
    };
    let reads = 0;
    let lookups = 0;
    const engine = createAnalystEngine({
      getRecords: () => { reads++; return FLIGHTS; },
      getLayerSnapshot: () => ({
        id: 'flights', enabled: true, feedState: 'nominal', source: 'current-feed',
      }),
      resolveRegionRing: async () => {
        lookups++;
        return { ...TEXLAND, source: 'natural-earth' };
      },
    });
    await engine.query(
      { layers: ['flights'], scope: { kind: 'region', name: 'Texland' } },
      {
        beforeCommit: async (result) => {
          assert.equal(result.count, 3);
          assert.equal(result.coverage.scopeSource, 'natural-earth');
          const { scopeSource: _originalSource, ...coverage } = result.coverage;
          return {
            matched: [{ key: 'flights', rows: [FLIGHTS[1]] }],
            scopeLabel: 'the presented cohort',
            scopeDetail: 'the presented cohort window',
            coverage: {
              ...coverage,
              scope: committedScope,
              ...(scopeSource ? { scopeSource } : {}),
              feedProvenance: { layers: [committedSnapshot] },
            },
          };
        },
      },
    );
    const followUp = await engine.query({ followUp: true });
    assert.equal(followUp.count, 1);
    assert.deepEqual(followUp.items.map((item) => item.id), ['RCH01']);
    assert.equal(followUp.scopeLabel, 'the presented cohort');
    assert.equal(followUp.display.scope, 'the presented cohort window');
    assert.equal(followUp.coverage.scope, committedScope);
    if (scopeSource) assert.equal(followUp.coverage.scopeSource, scopeSource);
    else assert.equal(Object.hasOwn(followUp.coverage, 'scopeSource'), false);
    assert.equal(followUp.coverage.feedProvenance.overall, 'stale');
    assert.deepEqual(followUp.coverage.feedProvenance.layers, [committedSnapshot]);
    assert.equal(reads, 1, 'displayed cohort is not replaced by another feed read');
    assert.equal(lookups, 1, 'follow-up retains the committed scope without resolving again');
  });
}

test('analyst: attribute filter — above 40,000 ft (~12,192 m)', async () => {
  const r = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'anywhere' },
    filters: [{ field: 'altitudeM', op: 'gt', value: 12192 }],
  });
  assert.deepEqual(r.items.map((i) => i.id), ['RCH01']);
});

test('analyst: military flag + region compose', async () => {
  const r = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'region', name: 'Texland' },
    filters: [{ field: 'military', op: 'eq', value: true }],
  });
  assert.equal(r.count, 1);
  assert.equal(r.items[0].id, 'RCH01');
});

test('analyst: ships headed to Oakland (destination contains)', async () => {
  const r = await makeEngine().query({
    layers: ['ais-live-vessels'], scope: { kind: 'anywhere' },
    filters: [{ field: 'destination', op: 'contains', value: 'oakland' }],
  });
  assert.deepEqual(r.items.map((i) => i.id), ['EVERGIVEN']);
});

test('analyst: superlative — biggest fire in view radius', async () => {
  const r = await makeEngine().query({
    layers: ['local-firms'], scope: { kind: 'view' }, sortBy: 'frp', limit: 1,
  });
  assert.equal(r.items[0].id, 'FIRE-1', 'BC monster is out of view scope');
  assert.equal(r.summary.frpMax, 1500);
});

test('analyst: nearest sorting attaches distanceKm ascending', async () => {
  const r = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'view' }, sortBy: 'distance', limit: 3,
  });
  assert.ok(r.items[0].distanceKm <= r.items[1].distanceKm);
  assert.ok(Number.isFinite(r.items[0].distanceKm));
});

test('analyst: follow-up re-filters the remembered set without re-snapshot', async () => {
  const eng = makeEngine();
  const first = await eng.query({
    layers: ['flights'],
    scope: { kind: 'region', name: 'Texland' },
  });
  const r = await eng.query({
    followUp: true,
    filters: [{ field: 'onGround', op: 'eq', value: true }],
  });
  assert.equal(r.count, 1);
  assert.equal(r.items[0].id, 'GND1');
  assert.equal(r.coverage.followUp, true);
  assert.equal(r.scopeLabel, first.scopeLabel);
  assert.equal(r.display.scope, first.display.scope);
  assert.equal(r.coverage.scope, first.coverage.scope);
});

test('analyst: follow-ups preserve partial and unanswered coverage', async () => {
  const eng = createAnalystEngine({
    getRecords: (key) => (key === 'flights' ? FLIGHTS : []),
    getLayerSnapshot: (key) => ({
      enabled: key === 'flights',
      feedState: key === 'flights' ? 'nominal' : 'off',
    }),
    getViewContext: () => ({ lat: 30.27, lon: -97.74, viewRadiusKm: 150 }),
  });
  const first = await eng.query({
    layers: ['flights', 'military'],
    scope: { kind: 'anywhere' },
  });
  assert.equal(first.partial, true);
  assert.deepEqual(first.unanswered, ['military']);

  const followUp = await eng.query({ followUp: true, limit: 1 });
  assert.equal(followUp.partial, true);
  assert.deepEqual(followUp.unanswered, ['military']);
  assert.deepEqual(
    followUp.coverage.layersQueried.map(({ layerKey, status }) => [
      layerKey,
      status,
    ]),
    first.coverage.layersQueried.map(({ layerKey, status }) => [
      layerKey,
      status,
    ]),
  );
});

test('analyst: cancelled pre-commit work cannot replace follow-up memory', async () => {
  const eng = makeEngine();
  await eng.query({
    layers: ['flights'],
    scope: { kind: 'anywhere' },
    filters: [{ field: 'id', op: 'eq', value: 'SWA1' }],
  });
  let current = true;
  const stale = await eng.query(
    { layers: ['local-firms'], scope: { kind: 'anywhere' } },
    {
      isCurrent: () => current,
      beforeCommit: async () => {
        current = false;
      },
    },
  );
  assert.equal(stale.code, 'CANCELLED');
  const followUp = await eng.query({ followUp: true });
  assert.deepEqual(followUp.items.map((item) => item.id), ['SWA1']);
});

test('analyst: failed pre-commit work cannot replace follow-up memory', async () => {
  const eng = makeEngine();
  await eng.query({
    layers: ['flights'],
    scope: { kind: 'anywhere' },
    filters: [{ field: 'id', op: 'eq', value: 'SWA1' }],
  });
  await assert.rejects(
    eng.query(
      { layers: ['local-firms'], scope: { kind: 'anywhere' } },
      {
        beforeCommit: async () => {
          throw new Error('projection failed');
        },
      },
    ),
    /projection failed/,
  );
  const followUp = await eng.query({ followUp: true });
  assert.deepEqual(followUp.items.map((item) => item.id), ['SWA1']);
});

test('analyst: follow-ups preserve partial and unanswered coverage', async () => {
  const eng = createAnalystEngine({
    getRecords: (key) => (key === 'flights' ? FLIGHTS : []),
    getLayerSnapshot: (key) => ({
      enabled: key === 'flights',
      feedState: key === 'flights' ? 'nominal' : 'off',
    }),
    getViewContext: () => ({ lat: 30.27, lon: -97.74, viewRadiusKm: 150 }),
  });
  const first = await eng.query({
    layers: ['flights', 'military'],
    scope: { kind: 'anywhere' },
  });
  assert.equal(first.partial, true);
  assert.deepEqual(first.unanswered, ['military']);

  const followUp = await eng.query({ followUp: true, limit: 1 });
  assert.equal(followUp.partial, true);
  assert.deepEqual(followUp.unanswered, ['military']);
  assert.deepEqual(
    followUp.coverage.layersQueried.map(({ layerKey, status }) => [
      layerKey,
      status,
    ]),
    first.coverage.layersQueried.map(({ layerKey, status }) => [
      layerKey,
      status,
    ]),
  );
});

test('analyst: cancelled pre-commit work cannot replace follow-up memory', async () => {
  const eng = makeEngine();
  await eng.query({
    layers: ['flights'],
    scope: { kind: 'anywhere' },
    filters: [{ field: 'id', op: 'eq', value: 'SWA1' }],
  });
  let current = true;
  const stale = await eng.query(
    { layers: ['local-firms'], scope: { kind: 'anywhere' } },
    {
      isCurrent: () => current,
      beforeCommit: async () => {
        current = false;
      },
    },
  );
  assert.equal(stale.code, 'CANCELLED');
  const followUp = await eng.query({ followUp: true });
  assert.deepEqual(
    followUp.items.map((item) => item.id),
    ['SWA1'],
  );
});

test('analyst: failed pre-commit work cannot replace follow-up memory', async () => {
  const eng = makeEngine();
  await eng.query({
    layers: ['flights'],
    scope: { kind: 'anywhere' },
    filters: [{ field: 'id', op: 'eq', value: 'SWA1' }],
  });
  await assert.rejects(
    eng.query(
      { layers: ['local-firms'], scope: { kind: 'anywhere' } },
      {
        beforeCommit: async () => {
          throw new Error('projection failed');
        },
      },
    ),
    /projection failed/,
  );
  const followUp = await eng.query({ followUp: true });
  assert.deepEqual(
    followUp.items.map((item) => item.id),
    ['SWA1'],
  );
});

test('analyst: unresolved region is an honest failure, not empty success', async () => {
  const r = await makeEngine().query({ layers: ['flights'], scope: { kind: 'region', name: 'Atlantis' } });
  assert.equal(r.ok, false);
  assert.match(r.error, /Atlantis/);
});

test('analyst: a region lookup timeout is reported as region-timeout', async () => {
  const eng = createAnalystEngine({
    getRecords: () => FLIGHTS,
    resolveRegionRing: async (name) => ({ name, ring: null, error: 'region-timeout' }),
    getViewContext: () => ({ lat: 30.27, lon: -97.74, viewRadiusKm: 150 }),
  });
  const r = await eng.query({ layers: ['flights'], scope: { kind: 'region', name: 'Texas' } });
  assert.equal(r.ok, false);
  assert.equal(r.code, 'region-timeout');
  assert.match(r.error, /Texas/);
  assert.equal(r.coverage.scope, 'region:Texas:timeout');
});

test('analyst: region lookup receives and obeys the owning action signal', async () => {
  const controller = new AbortController();
  let receivedSignal = null;
  const eng = createAnalystEngine({
    getRecords: () => FLIGHTS,
    resolveRegionRing: async (_name, { signal }) => {
      receivedSignal = signal;
      await new Promise((resolve) =>
        signal.addEventListener('abort', resolve, { once: true }),
      );
      return null;
    },
    getViewContext: () => ({
      lat: 30.27,
      lon: -97.74,
      viewRadiusKm: 150,
    }),
  });
  const pending = eng.query(
    { layers: ['flights'], scope: { kind: 'region', name: 'Texas' } },
    {
      signal: controller.signal,
      isCurrent: () => !controller.signal.aborted,
    },
  );
  await Promise.resolve();
  controller.abort();
  const result = await pending;
  assert.equal(receivedSignal, controller.signal);
  assert.equal(result.code, 'CANCELLED');
  assert.equal(result.cancelled, true);
});

for (const [label, reason, trackAuthority] of [
  ['default abort reason', undefined, false],
  ['custom error reason', new Error('operator stopped'), false],
  ['primitive reason and revoked authority', 'operator stopped', true],
]) {
  test(`analyst: real region resolver cancellation preserves memory (${label})`, async () => {
    const started = Promise.withResolvers();
    const geocode = Promise.withResolvers();
    const controller = new AbortController();
    const lookups = [];
    const { resolveRegionRingForQuery } = createAnnotationResolver({
      featureSource: Object.fromEntries(FEATURE_SOURCE_METHODS.map((method) => [
        method,
        async () => { throw new Error('offline region query reached feature source'); },
      ])),
    });
    const placeSearch = {
      geocode(name, { signal }) {
        lookups.push(name);
        assert.equal(signal, controller.signal);
        started.resolve();
        return geocode.promise;
      },
    };
    const engine = createAnalystEngine({
      getRecords: () => FLIGHTS,
      resolveRegionRing: (name, signal) => resolveRegionRingForQuery(
        name, signal, placeSearch, { budgetMs: Infinity },
      ),
    });
    const first = await engine.query({
      layers: ['flights'], scope: { kind: 'region', name: 'Texas' },
    });
    assert.equal(first.ok, true);
    assert.equal(first.coverage.scopeSource, 'bundled-admin');
    assert.deepEqual(first.items.map((item) => item.id), ['SWA1', 'RCH01', 'GND1']);
    let commits = 0;
    const pending = engine.query(
      { layers: ['flights'], scope: { kind: 'region', name: 'Cordillera Oriental' } },
      {
        signal: controller.signal,
        ...(trackAuthority ? { isCurrent: () => !controller.signal.aborted } : {}),
        beforeCommit: async () => { commits++; },
      },
    );
    await started.promise;
    controller.abort(reason);
    // Let an actual late geocode result cross the resolver's post-await check.
    geocode.resolve({ place: {
      lat: 5, lng: -73, label: 'Cordillera Oriental',
      name: 'Cordillera Oriental', types: ['natural_feature'],
    } });
    const result = await pending;
    assert.equal(result.ok, false);
    assert.equal(result.code, 'CANCELLED');
    assert.equal(result.cancelled, true);
    assert.equal(commits, 0);
    const followUp = await engine.query({ followUp: true });
    assert.deepEqual(followUp.items.map((item) => item.id), first.items.map((item) => item.id));
    assert.equal(followUp.coverage.scope, first.coverage.scope);
    assert.equal(followUp.coverage.scopeSource, 'bundled-admin');
    assert.equal(followUp.scopeLabel, first.scopeLabel);
    assert.deepEqual(lookups, ['Cordillera Oriental'], 'follow-up does not resolve again');
  });
}

test('analyst: a rejected superseded region lookup returns cancellation and retains its prior cohort', async () => {
  const lookup = Promise.withResolvers();
  let current = true;
  const engine = createAnalystEngine({
    getRecords: () => FLIGHTS,
    resolveRegionRing: (name) => name === 'Texland'
      ? { ...TEXLAND, source: 'natural-earth' }
      : lookup.promise,
  });
  const first = await engine.query({ layers: ['flights'], scope: { kind: 'region', name: 'Texland' } });
  const pending = engine.query(
    { layers: ['flights'], scope: { kind: 'region', name: 'Replacement' } },
    { isCurrent: () => current },
  );
  current = false;
  lookup.reject(new Error('late lookup failed'));
  assert.equal((await pending).code, 'CANCELLED');
  const followUp = await engine.query({ followUp: true });
  assert.deepEqual(followUp.items.map((item) => item.id), first.items.map((item) => item.id));
  assert.equal(followUp.coverage.scopeSource, 'natural-earth');
  assert.equal(followUp.coverage.scope, first.coverage.scope);
});

test('analyst: an aborted owner cannot commit a region provider that returns a late success', async () => {
  const controller = new AbortController();
  const lookup = Promise.withResolvers();
  const engine = createAnalystEngine({
    getRecords: () => FLIGHTS,
    resolveRegionRing: () => lookup.promise,
  });
  const pending = engine.query(
    { layers: ['flights'], scope: { kind: 'region', name: 'Texland' } },
    { signal: controller.signal },
  );
  controller.abort();
  lookup.resolve({ ...TEXLAND, source: 'natural-earth' });
  assert.equal((await pending).code, 'CANCELLED');
  assert.equal(engine.hasMemory(), false);
});

for (const error of [new Error('live lookup failed'), new DOMException('resource stopped', 'AbortError')]) {
  test(`analyst: live region ${error.name} propagates without changing memory`, async () => {
    const controller = new AbortController();
    const engine = createAnalystEngine({
      getRecords: () => FLIGHTS,
      resolveRegionRing: async (name) => {
        if (name === 'Texland') return { ...TEXLAND, source: 'natural-earth' };
        throw error;
      },
    });
    const first = await engine.query({ layers: ['flights'], scope: { kind: 'region', name: 'Texland' } });
    await assert.rejects(
      engine.query(
        { layers: ['flights'], scope: { kind: 'region', name: 'Replacement' } },
        { signal: controller.signal },
      ),
      (thrown) => thrown === error,
    );
    assert.equal(controller.signal.aborted, false);
    const followUp = await engine.query({ followUp: true });
    assert.deepEqual(followUp.items.map((item) => item.id), first.items.map((item) => item.id));
    assert.equal(followUp.coverage.scope, first.coverage.scope);
    assert.equal(followUp.coverage.scopeSource, 'natural-earth');
  });
}

test('analyst: route fields queryable from cached enrichment only', async () => {
  const r = await makeEngine().query({
    layers: ['flights'], scope: { kind: 'anywhere' },
    filters: [{ field: 'routeDestination', op: 'eq', value: 'LAX' }],
  });
  assert.deepEqual(r.items.map((i) => i.id), ['SWA1'], 'null route fields never match');
});

test('analyst: satellites and local infrastructure are queryable layers', async () => {
  const SATS = [
    { id: 'ISS (ZARYA)', noradId: '25544', name: 'ISS (ZARYA)', lat: 30.3, lon: -97.7, altitudeM: 410000, satelliteClass: 'STATION · ISS', group: 'stations' },
    { id: 'GPS BIIR-2', noradId: '24876', name: 'GPS BIIR-2', lat: 51.0, lon: 0.0, altitudeM: 20200000, satelliteClass: 'NAV · GPS', group: 'gps-ops' },
  ];
  const DAMS = [
    { id: 'Austin Dam', name: 'Austin Dam', lat: 30.27, lon: -97.74, operator: 'LCRA', river: 'Colorado', output: '2 MW' },
    { id: 'Far Dam', name: 'Far Dam', lat: 45.0, lon: -122.0, operator: 'USACE', river: 'Columbia', output: '1000 MW' },
  ];
  const DCS = [
    { id: 'AUS-1', name: 'AUS-1', lat: 30.28, lon: -97.75, operator: 'Example Cloud', capacity: '27 MW' },
  ];
  const eng = createAnalystEngine({
    getRecords: (key) => ({ satellites: SATS, 'local-dams': DAMS, 'local-datacenters': DCS }[key] || []),
    resolveRegionRing: async (name) => (/texland/i.test(name) ? TEXLAND : null),
    getViewContext: () => ({ lat: 30.27, lon: -97.74, viewRadiusKm: 150 }),
  });

  const sats = await eng.query({
    layers: ['satellites'], scope: { kind: 'view' }, sortBy: 'distance', limit: 2,
  });
  assert.equal(sats.ok, true);
  assert.equal(sats.count, 1, 'GPS sat is out of the Austin view radius');
  assert.equal(sats.items[0].noradId, '25544');
  assert.ok(Number.isFinite(sats.items[0].distanceKm));

  const nav = await eng.query({
    layers: ['satellites'], scope: { kind: 'anywhere' },
    filters: [{ field: 'satelliteClass', op: 'contains', value: 'NAV' }],
  });
  assert.deepEqual(nav.items.map((i) => i.id), ['GPS BIIR-2']);

  const dams = await eng.query({
    layers: ['local-dams'], scope: { kind: 'view' }, sortBy: 'distance', limit: 5,
  });
  assert.equal(dams.count, 1);
  assert.equal(dams.items[0].id, 'Austin Dam');
  assert.equal(dams.items[0].river, 'Colorado');

  const dcs = await eng.query({
    layers: ['local-datacenters'], scope: { kind: 'region', name: 'Texland' },
    filters: [{ field: 'operator', op: 'contains', value: 'cloud' }],
  });
  assert.equal(dcs.count, 1);
  assert.equal(dcs.items[0].id, 'AUS-1');
});

test('helpers: haversine sanity + scope radius', () => {
  const km = haversineKm(30.2672, -97.7431, 29.7604, -95.3698); // Austin→Houston
  assert.ok(km > 200 && km < 280, `Austin-Houston ~235km, got ${km}`);
  const scoped = applyScope(FLIGHTS, { kind: 'radius' }, { center: { lat: 30.27, lon: -97.74 }, km: 50 });
  assert.deepEqual(scoped.map((f) => f.id).sort(), ['GND1', 'SWA1']);
});

test('bounded loaded cohorts disclose truncation before filtering and retain it on follow-up', async () => {
  const engine = createAnalystEngine({
    getRecords: () => [{ id: 'sample dam', lat: 0, lon: 0, name: 'sample' }],
    getRecordCoverage: () => ({ basis: 'bounded-loaded-records', recordsExamined: 1, loadedCount: 3000, sourceTruncated: true }),
    getViewContext: () => ({ lat: 0, lon: 0, viewRadiusKm: 25 }),
  });
  const result = await engine.query({ layers: ['local-dams'], scope: { kind: 'anywhere' }, sortBy: 'distance' });
  assert.equal(result.count, 1);
  assert.equal(result.coverage.layersQueried[0].sourceTruncated, true);
  assert.match(result.coverage.note, /omitted records may change the nearest item or count/);
  const followUp = await engine.query({ followUp: true });
  assert.equal(followUp.coverage.layersQueried[0].loadedCount, 3000);
});


test('follow-up provenance stays attached to old rows after a feed recovers', async () => {
  let state = 'stale';
  const engine = createAnalystEngine({
    getRecords: () => [{ id: 'A', lat: 0, lon: 0 }],
    getLayerSnapshot: () => ({ id: 'flights', enabled: true, feedState: state }),
    getViewContext: () => ({ lat: 0, lon: 0, viewRadiusKm: 25 }),
  });
  const first = await engine.query();
  state = 'nominal';
  const followUp = await engine.query({ followUp: true });
  assert.equal(first.coverage.feedProvenance.overall, 'stale');
  assert.equal(followUp.coverage.feedProvenance.overall, 'stale');
  engine.reset();
  assert.equal(engine.hasMemory(), false);
  assert.equal((await engine.query()).coverage.feedProvenance.overall, 'nominal');
});
