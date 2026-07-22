'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerVat(program) {
  const vat = program.command('vat').description('VAT, GST, and company registration number lookup');

  vat
    .command('lookup <domains>')
    .description('Get VAT/GST/company registration numbers for 1 to 16 comma-separated domains')
    .action(async (domainsArg) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(domainsArg, 'domains');
      const params = { KEY: key, LOOKUP: domainsArg };

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Fetching VAT registration numbers for ${domainsArg}...`, stream: process.stderr }).start();
      try {
        const data = await request('vat', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });

  vat
    .command('types')
    .description('List all VAT registration types (no API key required)')
    .action(async () => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const params = {};

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        Object.assign(params, extra);
      }

      const spinner = opts.quiet ? null : ora({ text: 'Fetching VAT registration types...', stream: process.stderr }).start();
      try {
        const data = await request('vat-types', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
