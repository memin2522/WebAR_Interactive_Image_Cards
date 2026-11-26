import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRegister } from '../js/register.js';
import { nextModelIndex } from '../js/model-cycle.js';
import { targetConfigs } from '../js/config/targetInfo.js';
import { STATUS_MESSAGES, TIMING, UI_TEXT, REGISTER } from '../js/config/config.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Asset paths in the app are relative to index.html ("./assets/...").
const onDisk = (path) => existsSync(join(root, path));

describe('register', () => {
  const calls = [];
  const fetchFn = (url, options) => calls.push({ url, options });

  test('is disabled when the URL is empty', () => {
    const register = createRegister({ url: '', interactive: 'x', session: 's', fetchFn, userAgent: 'UA' });
    register('card');
    assert.equal(calls.length, 0);
  });

  test('posts the expected payload', () => {
    const register = createRegister({
      url: 'http://localhost:3000/api/register', interactive: 'demo', session: 'abc', fetchFn,
      userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile',
    });
    register('PAPA: papa chorreada');
    const { url, options } = calls.at(-1);
    assert.equal(url, 'http://localhost:3000/api/register');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), {
      interactive: 'demo',
      target: 'PAPA: papa chorreada',
      session: 'abc',
      device: 'mobile',
      os: 'Mozilla/5.0 (Linux; Android 14) Mobile',
    });
  });

  test('reports desktop for a desktop user agent', () => {
    const register = createRegister({ url: 'http://x.test', interactive: 'd', session: 's', fetchFn, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
    register('t');
    assert.equal(JSON.parse(calls.at(-1).options.body).device, 'desktop');
  });

  test('is disabled by default (no runtime settings)', () => {
    assert.equal(REGISTER.url, '');
    assert.equal(REGISTER.interactive, 'interactive-image-cards');
  });
});

describe('action button cycle', () => {
  test('goes through every model, then empty, then back to the first', () => {
    const sequence = [];
    let index = 0;
    for (let i = 0; i < 4; i++) {
      index = nextModelIndex(index, 2);
      sequence.push(index);
    }
    assert.deepEqual(sequence, [1, -1, 0, 1]);
  });

  test('labels', () => {
    assert.equal(UI_TEXT.actionLabel, 'COMER');
    assert.equal(UI_TEXT.resetLabel, 'REINICIAR');
  });
});

describe('content configuration', () => {
  test('has 8 cards with consecutive target indexes', () => {
    assert.equal(targetConfigs.length, 8);
    assert.deepEqual(targetConfigs.map((c) => c.targetIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
  });

  for (const card of targetConfigs) {
    test(`card ${card.targetIndex} (${card.statusLabel}) is complete and its models exist`, () => {
      assert.ok(card.title && card.statusLabel);
      assert.ok(Array.isArray(card.models) && card.models.length > 0);
      assert.ok(Array.isArray(card.stats) && card.stats.length > 0);
      for (const stat of card.stats) assert.ok(stat.label && stat.value);
      for (const path of [card.skeletonPath, ...card.models]) {
        assert.ok(onDisk(path), `missing ${path}`);
      }
    });
  }

  test('the targets file and the other assets referenced by the code exist', () => {
    const main = readFileSync(join(root, 'js/main.js'), 'utf8');
    const config = readFileSync(join(root, 'js/config/config.js'), 'utf8');
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    const paths = [...(main + config + html).matchAll(/\.\/assets\/[^'"\s)]+/g)].map((m) => m[0]);
    assert.ok(paths.length >= 8);
    for (const path of paths) assert.ok(onDisk(path), `missing ${path}`);
  });
});

describe('status messages and timing', () => {
  test('messages', () => {
    assert.equal(STATUS_MESSAGES.targetDetected('papa'), 'Target de papa detectado.');
    assert.equal(STATUS_MESSAGES.modelLoadError('yuca'), 'No se pudo cargar el modelo de yuca.');
  });

  test('timing', () => {
    assert.equal(TIMING.skeletonHoldMs, 3000);
    assert.equal(TIMING.skeletonFadeMs, 600);
  });
});

describe('docker runtime settings', () => {
  test('env.sh writes env.js from environment variables, escaping quotes', () => {
    const out = join(mkdtempSync(join(tmpdir(), 'env-')), 'env.js');
    execFileSync('sh', [join(root, 'docker/env.sh')], {
      env: { PATH: process.env.PATH, APP_ENV_FILE: out, REGISTER_API_URL: "http://api.test/api/register?a='b'" },
    });
    const window = {};
    new Function('window', readFileSync(out, 'utf8'))(window);
    assert.deepEqual(window.APP_ENV, {
      REGISTER_API_URL: "http://api.test/api/register?a='b'",
      REGISTER_INTERACTIVE_ID: 'interactive-image-cards',
    });
  });
});
