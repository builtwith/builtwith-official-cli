'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const output = require('../output');
const ora = require('ora');

module.exports = function registerVector(program) {
  const vector = program.command('vector').description('Vector search for technologies and categories');

  vector
    .command('search <query>')
    .description('Search technologies and categories by text using semantic similarity')
    .option('--limit <n>', 'Number of results (default 10, max 100)', parseInt)
    .action(async (queryArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key, QUERY: queryArg };
      if (cmdOpts.limit) params.LIMIT = cmdOpts.limit;
      const spinner = opts.quiet ? null : ora({ text: `Searching for "${queryArg}"...`, stream: process.stderr }).start();
      try {
        const data = await request('vector', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
