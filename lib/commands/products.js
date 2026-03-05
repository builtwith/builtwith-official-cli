'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput, validatePosInt } = require('../validate');
const output = require('../output');
const ora = require('ora');

module.exports = function registerProducts(program) {
  const products = program.command('products').description('Ecommerce product search');

  products
    .command('search <query>')
    .description('Search for ecommerce products')
    .option('--page <n>', 'Page number', '1')
    .option('--limit <n>', 'Results per page', '20')
    .action(async (query, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(query, 'query');
      const page = validatePosInt(cmdOpts.page, 'page');
      const limit = validatePosInt(cmdOpts.limit, 'limit');
      const params = { KEY: key, QUERY: query, PAGE: page, LIMIT: limit };

      if (opts.params) {
        let extra;
        try { extra = JSON.parse(opts.params); } catch (_) { throw new InputError('--params must be valid JSON'); }
        if (typeof extra !== 'object' || extra === null || Array.isArray(extra)) throw new InputError('--params must be a JSON object');
        const savedKey = params.KEY;
        Object.assign(params, extra);
        params.KEY = savedKey;
      }

      const spinner = opts.quiet ? null : ora({ text: `Searching products for "${query}"...`, stream: process.stderr }).start();
      try {
        const data = await request('products', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
