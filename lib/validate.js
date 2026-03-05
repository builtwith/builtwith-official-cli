'use strict';

const { InputError } = require('./errors');

function validateInput(value, label) {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new InputError(`${label} is required and must not be empty`);
  }
  if (/[\x00-\x1f\x7f]/.test(value)) {
    throw new InputError(`${label} must not contain control characters`);
  }
  if (/(\.\.\/|\.\.\\)/.test(value)) {
    throw new InputError(`${label} contains invalid path traversal sequence`);
  }
  if (/[?&]/.test(value)) {
    throw new InputError(`${label} must not contain query string characters`);
  }
  return value;
}

function validateDateRange(value) {
  if (!/^\d{8}-\d{8}$/.test(value)) {
    throw new InputError(`Date range must be in YYYYMMDD-YYYYMMDD format, got: ${value}`);
  }
  return value;
}

function validatePosInt(value, label) {
  if (!/^\d+$/.test(String(value))) {
    throw new InputError(`${label} must be a non-negative integer, got: ${value}`);
  }
  return parseInt(value, 10);
}

module.exports = { validateInput, validateDateRange, validatePosInt };
