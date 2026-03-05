'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput, validatePosInt } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerLists(program) {
  const lists = program.command('lists').description('Technology lists');

  lists
    .command('tech <tech>')
    .description('Get list of sites using a technology')
    .option('--offset <n>', 'Result offset', '0')
    .option('--limit <n>', 'Max results', '20')
    .action(async (tech, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(tech, 'tech');
      const offset = validatePosInt(cmdOpts.offset, 'offset');
      const limit = validatePosInt(cmdOpts.limit, 'limit');
      const params = { KEY: key, TECH: tech, OFFSET: offset, LIMIT: limit };

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Fetching list for ${tech}...`, stream: process.stderr }).start();
      try {
        const data = await request('lists', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
