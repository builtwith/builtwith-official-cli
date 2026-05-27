'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const output = require('../output');
const ora = require('ora');

module.exports = function registerAsk(program) {
  const ask = program.command('ask').description('Natural language website list lookup');

  ask
    .command('search <query>')
    .description('Search for websites using a natural language query (e.g. "Magento websites in Spain")')
    .option('--commit', 'Run a full Ask report (up to 1000 results; uses more API credits)')
    .option('--next-offset <offset>', 'Pagination offset from previous response NextOffset field')
    .option('--meta', 'Include metadata in results')
    .action(async (queryArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key, QUERY: queryArg };
      if (cmdOpts.commit) params.COMMIT = 'true';
      if (cmdOpts.nextOffset) params.NEXTOFFSET = cmdOpts.nextOffset;
      if (cmdOpts.meta) params.META = 'yes';
      const spinner = opts.quiet ? null : ora({ text: `Asking BuiltWith: "${queryArg}"...`, stream: process.stderr }).start();
      try {
        const data = await request('ask', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
