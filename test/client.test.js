'use strict';

const { test, describe, mock } = require('node:test');
const assert = require('node:assert/strict');

describe('client - buildUrl', () => {
  let buildUrl;

  test('builds correct URL for domain endpoint', () => {
    delete require.cache[require.resolve('../lib/client')];
    delete require.cache[require.resolve('../lib/errors')];
    ({ buildUrl } = require('../lib/client'));

    const url = buildUrl('domain', { KEY: 'mykey', LOOKUP: 'example.com' });
    assert.ok(url.startsWith('https://api.builtwith.com/v23/api.json'));
    assert.ok(url.includes('KEY=mykey'));
    assert.ok(url.includes('LOOKUP=example.com'));
  });

  test('omits false and null params', () => {
    delete require.cache[require.resolve('../lib/client')];
    ({ buildUrl } = require('../lib/client'));

    const url = buildUrl('domain', { KEY: 'k', LOOKUP: 'x.com', NOPII: false, NOMETA: null, NOATTR: undefined });
    assert.ok(!url.includes('NOPII'));
    assert.ok(!url.includes('NOMETA'));
    assert.ok(!url.includes('NOATTR'));
  });

  test('boolean true becomes empty string param (flag present)', () => {
    delete require.cache[require.resolve('../lib/client')];
    ({ buildUrl } = require('../lib/client'));

    const url = buildUrl('domain', { KEY: 'k', LOOKUP: 'x.com', NOPII: true });
    assert.ok(url.includes('NOPII='));
  });

  test('throws on unknown endpoint', () => {
    delete require.cache[require.resolve('../lib/client')];
    ({ buildUrl } = require('../lib/client'));

    assert.throws(() => buildUrl('nonexistent', {}), /Unknown endpoint/);
  });
});

describe('client - maskKey', () => {
  let maskKey;

  test('masks API key in URL', () => {
    delete require.cache[require.resolve('../lib/client')];
    delete require.cache[require.resolve('../lib/errors')];
    ({ maskKey } = require('../lib/client'));

    const url = 'https://api.builtwith.com/v23/api.json?KEY=secret123&LOOKUP=example.com';
    const masked = maskKey(url, 'secret123');
    assert.ok(!masked.includes('secret123'));
    assert.ok(masked.includes('REDACTED'));
  });

  test('returns url unchanged when no key provided', () => {
    delete require.cache[require.resolve('../lib/client')];
    ({ maskKey } = require('../lib/client'));

    const url = 'https://example.com/api?foo=bar';
    assert.equal(maskKey(url, null), url);
  });
});

describe('client - errors module', () => {
  test('ApiError sets correct exit code for 401', () => {
    delete require.cache[require.resolve('../lib/errors')];
    const { ApiError, EXIT_CODES } = require('../lib/errors');
    const err = new ApiError('Unauthorized', 401);
    assert.equal(err.exitCode, EXIT_CODES.AUTH);
  });

  test('ApiError sets correct exit code for 404', () => {
    const { ApiError, EXIT_CODES } = require('../lib/errors');
    const err = new ApiError('Not found', 404);
    assert.equal(err.exitCode, EXIT_CODES.NOT_FOUND);
  });

  test('ApiError sets correct exit code for 429', () => {
    const { ApiError, EXIT_CODES } = require('../lib/errors');
    const err = new ApiError('Rate limited', 429);
    assert.equal(err.exitCode, EXIT_CODES.RATE_LIMIT);
  });

  test('NetworkError uses NETWORK exit code', () => {
    const { NetworkError, EXIT_CODES } = require('../lib/errors');
    const err = new NetworkError('Connection refused');
    assert.equal(err.exitCode, EXIT_CODES.NETWORK);
  });

  test('InputError uses INVALID_INPUT exit code', () => {
    const { InputError, EXIT_CODES } = require('../lib/errors');
    const err = new InputError('Bad argument');
    assert.equal(err.exitCode, EXIT_CODES.INVALID_INPUT);
  });
});
