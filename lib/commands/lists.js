'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const { validateInput, validatePosInt } = require('../validate');
const output = require('../output');
const ora = require('ora');

const ATTRIBUTE_FILTERS = [
  ['spend', 'SPEND', 'Monthly technology spend filter, e.g. 100|GT'],
  ['revenue', 'REVENUE', 'Estimated ecommerce sales revenue filter, e.g. 100000|GT'],
  ['sku', 'SKU', 'Product count filter, e.g. 1000|GTE'],
  ['followers', 'FOLLOWERS', 'Followers filter, e.g. 5000|GTE'],
  ['employees', 'EMPLOYEES', 'Employee count filter, e.g. 50|GTE'],
  ['sitemap', 'SITEMAP', 'Sitemap URL count filter, e.g. 100|GT'],
  ['pageRank', 'PAGERANK', 'Page rank filter, e.g. 1000000|LT'],
  ['bwRank', 'BWRANK', 'BuiltWith rank filter, e.g. 50000|LTE'],
  ['tranco', 'TRANCO', 'Tranco rank filter, e.g. 100000|LTE'],
  ['majestic', 'MAJESTIC', 'Majestic rank filter, e.g. 100000|LTE'],
  ['bws', 'BWS', 'BuiltWith score filter, e.g. 50|GTE'],
  ['ecat', 'ECAT', 'Ecommerce category id filter, e.g. 123|EQ'],
  ['aim', 'AIM', 'AI maturity filter, e.g. 50|GTE'],
  ['aio', 'AIO', 'AI openness filter, e.g. 50|GTE'],
  ['air', 'AIR', 'AI readiness filter, e.g. 50|GTE'],
  ['aiv', 'AIV', 'AI visibility filter, e.g. 50|GTE'],
];

module.exports = function registerLists(program) {
  const lists = program.command('lists').description('Technology lists');

  const techCommand = lists
    .command('tech <tech>')
    .description('Get list of sites using a technology')
    .option('--other-techs <names>', 'Comma-separated additional required technologies')
    .option('--country <codes>', 'Comma-separated country filters, e.g. US,CA')
    .option('--since <date>', 'Date or relative time filter, e.g. "30 days ago"')
    .option('--offset <n>', 'Result offset', '0')
    .option('--limit <n>', 'Max results', '20')
    .option('--meta', 'Include metadata')
    .option('--all', 'Include historical sites');

  for (const [, apiName, description] of ATTRIBUTE_FILTERS) {
    const optionName = apiName.toLowerCase().replace('pagerank', 'page-rank').replace('bwrank', 'bw-rank');
    techCommand.option(`--${optionName} <filter>`, description);
  }

  techCommand.action(async (tech, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      validateInput(tech, 'tech');
      const offset = validatePosInt(cmdOpts.offset, 'offset');
      const limit = validatePosInt(cmdOpts.limit, 'limit');
      const params = { KEY: key, TECH: tech, OFFSET: offset, LIMIT: limit };
      if (cmdOpts.otherTechs) {
        validateInput(cmdOpts.otherTechs, 'otherTechs');
        params.OTHERTECHS = cmdOpts.otherTechs;
      }
      if (cmdOpts.country) {
        validateInput(cmdOpts.country, 'country');
        params.COUNTRY = cmdOpts.country;
      }
      if (cmdOpts.since) {
        validateInput(cmdOpts.since, 'since');
        params.SINCE = cmdOpts.since;
      }
      if (cmdOpts.meta) params.META = 'yes';
      if (cmdOpts.all) params.ALL = 'yes';
      for (const [optionKey, apiName] of ATTRIBUTE_FILTERS) {
        if (cmdOpts[optionKey]) {
          validateInput(cmdOpts[optionKey], optionKey);
          params[apiName] = cmdOpts[optionKey];
        }
      }

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
