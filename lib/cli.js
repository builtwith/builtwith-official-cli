'use strict';

const { Command } = require('commander');
const { EXIT_CODES, BuiltWithError } = require('./errors');
const output = require('./output');

function run() {
  const program = new Command();

  program
    .name('bw')
    .description('Non-interactive, scriptable CLI for the BuiltWith API')
    .version('1.0.0')
    .exitOverride()
    .addHelpCommand()
    .option('--key <apikey>', 'API key (overrides env and rc file)')
    .option('--format <fmt>', 'Output format: json (default) | table | csv', 'json')
    .option('--no-color', 'Disable color on stderr')
    .option('--dry-run', 'Print request URL (key masked) and exit')
    .option('--debug', 'Print HTTP metadata to stderr')
    .option('--quiet', 'Suppress spinner/info stderr output')
    .option('--params <json>', 'Extra API params as JSON object (merged after command params; KEY is protected)')
    .option('--fields <fields>', 'Comma-separated dot-notation fields to include in output (e.g. "Results,Paths.0")');

  // Register all command modules
  require('./commands/domain')(program);
  require('./commands/lists')(program);
  require('./commands/relationships')(program);
  require('./commands/free')(program);
  require('./commands/company')(program);
  require('./commands/tags')(program);
  require('./commands/recommendations')(program);
  require('./commands/redirects')(program);
  require('./commands/keywords')(program);
  require('./commands/trends')(program);
  require('./commands/products')(program);
  require('./commands/trust')(program);
  require('./commands/account')(program);
  require('./commands/live')(program);
  require('./commands/mcp')(program);
  require('./commands/schema')(program);

  program.parseAsync(process.argv).catch(err => {
    if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
      process.exit(EXIT_CODES.SUCCESS);
    }
    if (err instanceof BuiltWithError) {
      output.error(err.message);
      process.exit(err.exitCode);
    }
    // Commander parse errors (missing args, unknown options)
    if (err.code && err.code.startsWith('commander.')) {
      output.error(err.message);
      process.exit(EXIT_CODES.INVALID_INPUT);
    }
    output.error(err.message || String(err));
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(EXIT_CODES.UNEXPECTED);
  });
}

module.exports = { run };
