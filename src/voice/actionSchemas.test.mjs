import { realtimeInstructions } from '../../server/providers/openai/instructions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { GEV_ACTION_SCHEMAS, createActionTools } from './actionSchemas.js';
import { GEV_REALTIME_TOOLS } from '../../server/providers/openai/tools.js';
import { createAreaStore } from '../data/areaStore.js';
import { createAreaResolver } from '../data/areaResolver.js';
import { findAdminCandidates } from '../data/adminBoundaries.js';
import { validateArgs } from '../../scripts/voice-bench/grade.mjs';

const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, child]) => [key, stable(child)]),
        )
      : value;

test('the complete Realtime tool payload pins the additive analyst and satellite release', () => {
  const digest = createHash('sha256')
    .update(
      JSON.stringify(
        stable(
          GEV_REALTIME_TOOLS.filter(
            (tool) => tool.name !== 'spatial_selection',
          ),
        ),
      ),
    )
    .digest('hex');
  assert.equal(
    digest,
    '9e33ac0fa5a860a17bb6d79f2c43646b6c36d0c932590bf114814e891a1c96de',
  );
});

test('descriptions customize wording without changing immutable shared arguments', () => {
  const descriptions = {
    fly_to_location: {
      description: 'Navigate',
      parameters: { properties: { query: { description: 'A place' } } },
    },
  };
  const tools = createActionTools(descriptions);
  const tool = tools.find((tool) => tool.name === 'fly_to_location');
  assert.equal(tool.description, 'Navigate');
  assert.equal(tool.parameters.properties.query.description, 'A place');
  assert.equal(tool.parameters.properties.query.type, 'string');
  tool.parameters.properties.query.type = 'number';
  assert.equal(
    createActionTools()[0].parameters.properties.query.type,
    'string',
  );
  assert.throws(() => {
    GEV_ACTION_SCHEMAS[0].parameters.properties.query.type = 'number';
  }, TypeError);
  assert.equal(
    JSON.stringify(GEV_ACTION_SCHEMAS).includes('"description"'),
    false,
  );
});

test('every emitted area candidate round-trips through the production schema', async () => {
  const candidateSchema = GEV_ACTION_SCHEMAS.find(
    (tool) => tool.name === 'resolve_area',
  ).parameters.properties.candidateId;
  const resolver = createAreaResolver({
    store: createAreaStore(),
    findAdminCandidates,
  });
  const ambiguous = await resolver.resolve({ query: 'Georgia' });
  assert.equal(ambiguous.needsClarification, true);
  for (const choice of ambiguous.candidates) {
    assert.ok(choice.candidateId.length >= candidateSchema.minLength);
    assert.ok(choice.candidateId.length <= candidateSchema.maxLength);
    assert.match(choice.candidateId, new RegExp(candidateSchema.pattern, 'u'));
    assert.equal(
      (await resolver.resolve({ candidateId: choice.candidateId })).ok,
      true,
    );
  }
  assert.equal(ambiguous.candidates[0].candidateId.length, 41);
  const grammar = new RegExp(candidateSchema.pattern, 'u');
  for (const malformed of [
    'ne:state:bad slug',
    'ne:state:../../etc',
    'ne:state:!!!',
    'ne:state:a_b',
  ])
    assert.doesNotMatch(malformed, grammar);
  assert.ok(`ne:state:${'x'.repeat(80)}`.length > candidateSchema.maxLength);
});

test('metadata cannot add tools, fields, types or enum values', () => {
  for (const descriptions of [
    { execute_shell: { description: 'not an action' } },
    {
      fly_to_location: {
        parameters: { properties: { description: 'new field' } },
      },
    },
    { fly_to_location: { $position: -1, description: 'invalid position' } },
    { fly_to_location: { name: 'other' } },
    {
      fly_to_location: {
        parameters: { properties: { arbitrary: { description: 'new field' } } },
      },
    },
    {
      fly_to_location: {
        parameters: { properties: { query: { type: 'number' } } },
      },
    },
    { fly_to_location: { parameters: { required: { 0: 'another' } } } },
    { fly_to_location: { description: { nested: 'invalid' } } },
  ])
    assert.throws(() => createActionTools(descriptions), TypeError);
});

test('all legacy action arguments are byte-identical after removing the deliberate additions', () => {
  const legacy = structuredClone(GEV_ACTION_SCHEMAS).filter(
    (tool) => tool.name !== 'next_satellite_pass',
  );
  const layers = legacy.find((tool) => tool.name === 'analyst_query').parameters
    .properties.layers.items;
  layers.enum = layers.enum.filter(
    (key) => !['satellites', 'local-datacenters', 'local-dams'].includes(key),
  );
  // Independently derived by executing trusted c9f9896 actionSchemas in the restricted container.
  assert.equal(
    createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),
    '820fff21658f6907e1010b2b79c5431a77f4e34afd2277d62d8de46c368b6f8c',
  );
});
