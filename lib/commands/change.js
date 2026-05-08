'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { validateInput } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerChange(program) {
  const change = program.command('change').description('Technology additions and removals');

  change
    .command('lookup <domains>')
    .description('Get technology additions and removals for one or more comma-separated domains')
    .option('--since <date>', 'Natural language date window (default: 3 months, e.g. "last month")')
    .action(async (domainsArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(domainsArg, 'domains');
      if (cmdOpts.since) validateInput(cmdOpts.since, 'since');

      const params = { KEY: key, LOOKUP: domainsArg };
      if (cmdOpts.since) params.SINCE = cmdOpts.since;

      const spinner = opts.quiet ? null : ora({ text: `Fetching changes for ${domainsArg}...`, stream: process.stderr }).start();
      try {
        const data = await request('change', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
