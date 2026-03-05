'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Capture stdout writes
function captureStdout(fn) {
  const chunks = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk) => { chunks.push(chunk); return true; };
  try {
    fn();
  } finally {
    process.stdout.write = original;
  }
  return chunks.join('');
}

describe('output - print', () => {
  let output;

  test('prints valid JSON by default', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const data = { foo: 'bar', count: 42 };
    const result = captureStdout(() => output.print(data, { format: 'json' }));
    assert.deepEqual(JSON.parse(result), data);
  });

  test('prints array as JSON', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const data = [{ a: 1 }, { a: 2 }];
    const result = captureStdout(() => output.print(data, { format: 'json' }));
    assert.deepEqual(JSON.parse(result), data);
  });

  test('prints table format without error', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const data = [{ name: 'WordPress', version: '6.0' }];
    const result = captureStdout(() => output.print(data, { format: 'table' }));
    assert.ok(result.includes('WordPress'));
    assert.ok(result.includes('name'));
  });

  test('prints csv format with headers', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const data = [{ name: 'WordPress', version: '6.0' }];
    const result = captureStdout(() => output.print(data, { format: 'csv' }));
    assert.ok(result.includes('name'));
    assert.ok(result.includes('WordPress'));
  });

  test('defaults to json format', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const data = { x: 1 };
    const result = captureStdout(() => output.print(data, {}));
    assert.deepEqual(JSON.parse(result), data);
  });

  test('handles empty array gracefully in table mode', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const result = captureStdout(() => output.print([], { format: 'table' }));
    assert.ok(result.includes('no results'));
  });

  test('handles scalar value', () => {
    delete require.cache[require.resolve('../lib/output')];
    output = require('../lib/output');
    const result = captureStdout(() => output.print(42, { format: 'json' }));
    assert.equal(JSON.parse(result), 42);
  });
});

describe('filterFields', () => {
  let filterFields;

  test('returns data unchanged when fieldsStr is null', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = { a: 1, b: 2 };
    assert.deepEqual(filterFields(data, null), data);
  });

  test('returns data unchanged when fieldsStr is empty string', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = { a: 1, b: 2 };
    assert.deepEqual(filterFields(data, ''), data);
  });

  test('extracts single top-level field', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = { a: 1, b: 2 };
    assert.deepEqual(filterFields(data, 'a'), { a: 1 });
  });

  test('extracts multiple comma-separated fields', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = { a: 1, b: 2, c: 3 };
    assert.deepEqual(filterFields(data, 'a,c'), { a: 1, c: 3 });
  });

  test('extracts dot-notation nested path with dot key in result', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = { outer: { inner: 42 } };
    assert.deepEqual(filterFields(data, 'outer.inner'), { 'outer.inner': 42 });
  });

  test('missing path yields undefined value in result', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = { a: 1 };
    const result = filterFields(data, 'missing');
    assert.ok('missing' in result);
    assert.equal(result.missing, undefined);
  });

  test('filters each item when data is array', () => {
    delete require.cache[require.resolve('../lib/output')];
    ({ filterFields } = require('../lib/output'));
    const data = [{ a: 1, b: 10 }, { a: 2, b: 20 }];
    assert.deepEqual(filterFields(data, 'a'), [{ a: 1 }, { a: 2 }]);
  });

  test('integration: print() with fields option filters before formatting', () => {
    delete require.cache[require.resolve('../lib/output')];
    const output = require('../lib/output');
    const data = { name: 'WordPress', version: '6.0', extra: 'ignored' };
    const result = captureStdout(() => output.print(data, { format: 'json', fields: 'name' }));
    assert.deepEqual(JSON.parse(result), { name: 'WordPress' });
  });
});
