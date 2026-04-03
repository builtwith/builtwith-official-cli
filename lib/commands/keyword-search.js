'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const output = require('../output');
const ora = require('ora');

module.exports = function registerKeywordSearch(program) {
  const kws = program.command('keyword-search').description('Find websites containing a specific keyword');

  kws
    .command('search <keyword>')
    .description('Search for websites by keyword')
    .option('--limit <n>', 'Results per page (16-1000)', parseInt)
    .option('--offset <offset>', 'Pagination offset (NextOffset from previous response)')
    .action(async (keywordArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key, KEYWORD: keywordArg };
      if (cmdOpts.limit) params.LIMIT = cmdOpts.limit;
      if (cmdOpts.offset) params.OFFSET = cmdOpts.offset;
      const spinner = opts.quiet ? null : ora({ text: `Searching for "${keywordArg}"...`, stream: process.stderr }).start();
      try {
        const data = await request('keyword-search', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
