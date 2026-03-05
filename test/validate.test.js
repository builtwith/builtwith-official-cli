'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { validateInput, validateDateRange, validatePosInt } = require('../lib/validate');

describe('validateInput', () => {
  test('throws on null', () => {
    assert.throws(() => validateInput(null, 'domain'), /required/);
  });

  test('throws on empty string', () => {
    assert.throws(() => validateInput('', 'domain'), /required/);
  });

  test('throws on whitespace-only', () => {
    assert.throws(() => validateInput('   ', 'domain'), /required/);
  });

  test('throws on control char \\x01', () => {
    assert.throws(() => validateInput('exam\x01ple.com', 'domain'), /control/);
  });

  test('throws on newline', () => {
    assert.throws(() => validateInput('exam\nple.com', 'domain'), /control/);
  });

  test('throws on path traversal ../', () => {
    assert.throws(() => validateInput('../../etc/passwd', 'domain'), /path traversal/);
  });

  test('throws on path traversal ..\\', () => {
    assert.throws(() => validateInput('..\\..\\etc', 'domain'), /path traversal/);
  });

  test('throws on embedded ?', () => {
    assert.throws(() => validateInput('example.com?foo=bar', 'domain'), /query string/);
  });

  test('throws on embedded &', () => {
    assert.throws(() => validateInput('example.com&foo=bar', 'domain'), /query string/);
  });

  test('returns value for valid domain', () => {
    assert.equal(validateInput('example.com', 'domain'), 'example.com');
  });

  test('returns value for tech name with spaces', () => {
    assert.equal(validateInput('Google Analytics', 'tech'), 'Google Analytics');
  });
});

describe('validateDateRange', () => {
  test('accepts valid range', () => {
    assert.equal(validateDateRange('20240101-20241231'), '20240101-20241231');
  });

  test('throws on non-date string', () => {
    assert.throws(() => validateDateRange('not-a-date'), /YYYYMMDD/);
  });

  test('throws on ISO format', () => {
    assert.throws(() => validateDateRange('2024-01-01'), /YYYYMMDD/);
  });

  test('throws on incomplete date', () => {
    assert.throws(() => validateDateRange('20240101'), /YYYYMMDD/);
  });
});

describe('validatePosInt', () => {
  test('accepts 0', () => {
    assert.equal(validatePosInt('0', 'offset'), 0);
  });

  test('accepts 100', () => {
    assert.equal(validatePosInt('100', 'limit'), 100);
  });

  test('throws on negative number', () => {
    assert.throws(() => validatePosInt('-1', 'offset'), /non-negative integer/);
  });

  test('throws on alphabetic string', () => {
    assert.throws(() => validatePosInt('abc', 'offset'), /non-negative integer/);
  });

  test('throws on float', () => {
    assert.throws(() => validatePosInt('1.5', 'offset'), /non-negative integer/);
  });

  test('throws on empty string', () => {
    assert.throws(() => validatePosInt('', 'offset'), /non-negative integer/);
  });
});
