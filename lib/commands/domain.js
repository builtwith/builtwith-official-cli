'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput, validateDateRange } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerDomain(program) {
  const domain = program.command('domain').description('Domain technology lookup');

  domain
    .command('lookup <domain>')
    .description('Look up technologies used by a domain')
    .option('--nopii', 'Exclude PII data')
    .option('--nometa', 'Exclude meta data')
    .option('--noattr', 'Exclude attribution data')
    .option('--liveonly', 'Only return currently-live technologies')
    .option('--fdrange <YYYYMMDD-YYYYMMDD>', 'First-detected date range')
    .option('--ldrange <YYYYMMDD-YYYYMMDD>', 'Last-detected date range')
    .action(async (domainArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(domainArg, 'domain');
      if (cmdOpts.fdrange) validateDateRange(cmdOpts.fdrange);
      if (cmdOpts.ldrange) validateDateRange(cmdOpts.ldrange);

      const params = { KEY: key, LOOKUP: domainArg };
      // Boolean flags: true → '' so URL gets ?NOPII= which BuiltWith treats as present
      if (cmdOpts.nopii)   params.NOPII   = true;
      if (cmdOpts.nometa)  params.NOMETA  = true;
      if (cmdOpts.noattr)  params.NOATTR  = true;
      if (cmdOpts.liveonly) params.LIVEONLY = true;
      if (cmdOpts.fdrange) params.FDRANGE = cmdOpts.fdrange;
      if (cmdOpts.ldrange) params.LDRANGE = cmdOpts.ldrange;

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Looking up ${domainArg}...`, stream: process.stderr }).start();
      try {
        const data = await request('domain', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
