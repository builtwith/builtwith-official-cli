'use strict';

const fetch = require('node-fetch');
const { ApiError, NetworkError } = require('./errors');
const output = require('./output');

const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
  /system\s*prompt/i,
  /\[INST\]/,
  /<\|im_start\|>/,
];

function scanForInjection(data) {
  if (typeof data === 'string') {
    for (const p of INJECTION_PATTERNS) {
      if (p.test(data)) output.warn(`Possible prompt injection in response: "${data.slice(0, 80)}"`);
    }
  } else if (Array.isArray(data)) {
    for (const item of data) scanForInjection(item);
  } else if (data !== null && typeof data === 'object') {
    for (const v of Object.values(data)) scanForInjection(v);
  }
}

const BASE_URLS = {
  domain:          'https://api.builtwith.com/v22/api.json',
  lists:           'https://api.builtwith.com/lists12/api.json',
  relationships:   'https://api.builtwith.com/rv4/api.json',
  free:            'https://api.builtwith.com/free1/api.json',
  company:         'https://api.builtwith.com/ctu3/api.json',
  tags:            'https://api.builtwith.com/tag1/api.json',
  recommendations: 'https://api.builtwith.com/rec1/api.json',
  redirects:       'https://api.builtwith.com/redirect1/api.json',
  keywords:        'https://api.builtwith.com/kw2/api.json',
  trends:          'https://api.builtwith.com/trends/v6/api.json',
  products:        'https://api.builtwith.com/productv1/api.json',
  trust:           'https://api.builtwith.com/trustv1/api.json',
  vector:          'https://api.builtwith.com/vector/v1/api.json',
  whoami:          'https://api.builtwith.com/whoamiv1/api.json',
  usage:           'https://api.builtwith.com/usagev2/api.json',
};

/**
 * Build a URL with query params.
 * Boolean true values become empty string (e.g., NOPII=) which BuiltWith treats as flag present.
 */
function buildUrl(endpoint, params) {
  const base = BASE_URLS[endpoint];
  if (!base) throw new Error(`Unknown endpoint: ${endpoint}`);
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === false) continue;
    url.searchParams.set(k, v === true ? '' : String(v));
  }
  return url.toString();
}

function maskKey(url, key) {
  if (!key) return url;
  return url.replace(encodeURIComponent(key), 'REDACTED').replace(key, 'REDACTED');
}

async function request(endpoint, params, opts = {}) {
  const { dryRun, debug, spinner } = opts;
  const url = buildUrl(endpoint, params);

  if (dryRun) {
    const masked = maskKey(url, params.KEY || params.key);
    process.stdout.write(masked + '\n');
    process.exit(0);
  }

  if (debug) {
    process.stderr.write(`[debug] GET ${maskKey(url, params.KEY || params.key)}\n`);
  }

  if (spinner) spinner.start();

  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'builtwith-cli/1.0.0' },
      timeout: 30000,
    });
  } catch (err) {
    if (spinner) spinner.stop();
    throw new NetworkError(`Network request failed: ${err.message}`);
  }

  if (debug) {
    process.stderr.write(`[debug] HTTP ${res.status} ${res.statusText}\n`);
  }

  if (spinner) spinner.stop();

  let body;
  try {
    body = await res.json();
  } catch (_) {
    throw new ApiError(`Invalid JSON response (HTTP ${res.status})`, res.status);
  }

  if (!res.ok) {
    const msg = body && body.Errors
      ? body.Errors.map(e => e.Message || e).join('; ')
      : `HTTP ${res.status} ${res.statusText}`;
    throw new ApiError(msg, res.status);
  }

  // BuiltWith API sometimes returns error info in the body with HTTP 200
  if (body && body.Errors && body.Errors.length > 0) {
    const msg = body.Errors.map(e => e.Message || e).join('; ');
    // Treat auth-related messages as auth errors
    const isAuth = /key|auth|unauthori/i.test(msg);
    throw new ApiError(msg, isAuth ? 403 : 400);
  }

  scanForInjection(body);
  return body;
}

module.exports = { buildUrl, maskKey, request, scanForInjection, BASE_URLS };
