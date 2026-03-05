'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const output = require('../output');
const ora = require('ora');

function mergeParams(params, rawJson) {
  if (!rawJson) return;
  let extra;
  try { extra = JSON.parse(rawJson); } catch (_) { throw new InputError('--params must be valid JSON'); }
  if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
  const savedKey = params.KEY;
  Object.assign(params, extra);
  params.KEY = savedKey;
}

module.exports = function registerAccount(program) {
  const account = program.command('account').description('Account information');

  account
    .command('whoami')
    .description('Show account identity')
    .action(async () => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key };
      mergeParams(params, opts.params);
      const spinner = opts.quiet ? null : ora({ text: 'Fetching account...', stream: process.stderr }).start();
      try {
        const data = await request('whoami', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });

  account
    .command('usage')
    .description('Show API usage')
    .action(async () => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key };
      mergeParams(params, opts.params);
      const spinner = opts.quiet ? null : ora({ text: 'Fetching usage...', stream: process.stderr }).start();
      try {
        const data = await request('usage', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
