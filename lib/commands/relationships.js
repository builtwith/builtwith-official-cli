'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerRelationships(program) {
  const rel = program.command('relationships').description('Domain relationship data');

  rel
    .command('lookup <domain>')
    .description('Look up one page of related domains; follow next_page while more_results is true')
    .option('--page <number>', 'Positive page number (default 1)')
    .option('--ip', 'Include IP identifiers')
    .action(async (domainArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(domainArg, 'domain');
      const params = { KEY: key, LOOKUP: domainArg };
      if (cmdOpts.page !== undefined) {
        const page = Number(cmdOpts.page);
        if (!Number.isInteger(page) || page < 1) throw new InputError("--page must be a positive integer");
        params.PAGE = page;
      }
      if (cmdOpts.ip) params.IP = "yes";

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Fetching relationships for ${domainArg}...`, stream: process.stderr }).start();
      try {
        const data = await request('relationships', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
