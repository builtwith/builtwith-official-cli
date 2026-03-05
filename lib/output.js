'use strict';

const Table = require('cli-table3');
const { stringify } = require('csv-stringify/sync');
const chalk = require('chalk');

let noColor = false;

function setNoColor(val) {
  noColor = val;
  if (val) chalk.level = 0;
}

/**
 * Flatten a nested object into dot-notation key/value pairs (one level deep for tables).
 */
function flattenOne(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else if (Array.isArray(v)) {
      out[key] = JSON.stringify(v);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function toRows(data) {
  if (Array.isArray(data)) return data.map(item =>
    typeof item === 'object' && item !== null ? flattenOne(item) : { value: item }
  );
  if (typeof data === 'object' && data !== null) return [flattenOne(data)];
  return [{ value: data }];
}

function printJson(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

function printTable(data) {
  const rows = toRows(data);
  if (rows.length === 0) {
    process.stdout.write('(no results)\n');
    return;
  }
  const headers = Object.keys(rows[0]);
  const table = new Table({ head: headers });
  for (const row of rows) {
    table.push(headers.map(h => {
      const v = row[h];
      return v === null || v === undefined ? '' : String(v);
    }));
  }
  process.stdout.write(table.toString() + '\n');
}

function printCsv(data) {
  const rows = toRows(data);
  if (rows.length === 0) {
    process.stdout.write('\n');
    return;
  }
  const headers = Object.keys(rows[0]);
  const output = stringify(
    rows.map(r => headers.map(h => {
      const v = r[h];
      return v === null || v === undefined ? '' : String(v);
    })),
    { header: true, columns: headers }
  );
  process.stdout.write(output);
}

function extractPath(obj, dotPath) {
  return dotPath.split('.').reduce((cur, key) => (cur !== null && cur !== undefined ? cur[key] : undefined), obj);
}

function filterOne(item, paths) {
  if (item === null || typeof item !== 'object') return { value: item };
  const out = {};
  for (const p of paths) out[p] = extractPath(item, p);
  return out;
}

function filterFields(data, fieldsStr) {
  if (!fieldsStr) return data;
  const paths = fieldsStr.split(',').map(s => s.trim()).filter(Boolean);
  if (paths.length === 0) return data;
  if (Array.isArray(data)) return data.map(item => filterOne(item, paths));
  return filterOne(data, paths);
}

function print(data, opts = {}) {
  const d = opts.fields ? filterFields(data, opts.fields) : data;
  const fmt = (opts.format || 'json').toLowerCase();
  if (fmt === 'table') return printTable(d);
  if (fmt === 'csv') return printCsv(d);
  return printJson(d);
}

function error(msg) {
  const prefix = noColor ? '[error]' : chalk.red('[error]');
  process.stderr.write(`${prefix} ${msg}\n`);
}

function warn(msg) {
  const prefix = noColor ? '[warn]' : chalk.yellow('[warn]');
  process.stderr.write(`${prefix} ${msg}\n`);
}

function info(msg) {
  const prefix = noColor ? '[info]' : chalk.cyan('[info]');
  process.stderr.write(`${prefix} ${msg}\n`);
}

module.exports = { print, error, warn, info, setNoColor, filterFields };
