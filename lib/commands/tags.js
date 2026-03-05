'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerTags(program) {
  const tags = program.command('tags').description('Tags API lookup');

  tags
    .command('lookup <lookup>')
    .description('Find domains related to IP or other attributes')
    .action(async (lookup) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(lookup, 'lookup');
      const params = { KEY: key, LOOKUP: lookup };

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Fetching tags for ${lookup}...`, stream: process.stderr }).start();
      try {
        const data = await request('tags', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
