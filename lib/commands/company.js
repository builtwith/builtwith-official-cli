'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerCompany(program) {
  const company = program.command('company').description('Company to URL lookup');

  company
    .command('find <name>')
    .description('Find domains associated with a company name')
    .action(async (name) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(name, 'name');
      const params = { KEY: key, COMPANY: name };

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Finding company "${name}"...`, stream: process.stderr }).start();
      try {
        const data = await request('company', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
