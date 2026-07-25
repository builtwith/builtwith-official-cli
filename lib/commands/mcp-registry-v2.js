'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const output = require('../output');
const ora = require('ora');

module.exports = function registerMcpRegistryV2(program) {
  const mcpRegistryV2 = program.command('mcp-registry-v2').description('Search and browse the BuiltWith MCP registry (v2) of discovered remote MCP servers');

  mcpRegistryV2
    .command('search [query]')
    .description('Search the MCP registry (v2) by domain, description, endpoint URL, or tool name/description')
    .option('--category <category>', 'Filter by category (e.g. developer-tools)')
    .option('--offset <offset>', 'Pagination offset', parseInt)
    .action(async (queryArg, cmdOpts) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key };
      if (queryArg) params.SEARCH = queryArg;
      if (cmdOpts.category) params.CATEGORY = cmdOpts.category;
      if (cmdOpts.offset) params.OFFSET = cmdOpts.offset;
      const spinner = opts.quiet ? null : ora({ text: queryArg ? `Searching MCP registry (v2) for "${queryArg}"...` : 'Browsing MCP registry (v2)...', stream: process.stderr }).start();
      try {
        const data = await request('mcp-registry-v2', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
