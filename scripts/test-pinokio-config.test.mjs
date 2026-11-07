import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

test('pinokio configuration files are valid and loadable', () => {
  const pinokio = require('../pinokio/pinokio.js');
  assert.equal(typeof pinokio, 'object');
  assert.equal(pinokio.version, '3.6');
  assert.equal(pinokio.title, "God's Eye View");
  assert.equal(typeof pinokio.menu, 'function');

  const start = require('../pinokio/start.js');
  assert.equal(typeof start, 'object');
  assert.equal(start.daemon, true);
  assert.ok(Array.isArray(start.run));
  assert.equal(start.run[0].method, 'shell.run');
  assert.equal(start.run[0].params.path, '..');
  assert.equal(start.run[0].params.message, 'node scripts/pinokio-start.mjs');

  const install = require('../pinokio/install.js');
  assert.equal(typeof install, 'object');
  assert.ok(Array.isArray(install.run));

  const update = require('../pinokio/update.js');
  assert.equal(typeof update, 'object');
  assert.ok(Array.isArray(update.run));

  const reset = require('../pinokio/reset.js');
  assert.equal(typeof reset, 'object');
  assert.ok(Array.isArray(reset.run));
});
