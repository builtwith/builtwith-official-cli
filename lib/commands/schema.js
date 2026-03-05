'use strict';

module.exports = function registerSchema(program) {
  program
    .command('schema')
    .description('Output CLI schema as JSON for agent introspection')
    .option('--command <name>', 'Filter output to one command (e.g. "domain lookup")')
    .action(function(cmdOpts) {
      function serializeOption(opt) {
        return { flags: opt.flags, description: opt.description || '', default: opt.defaultValue ?? null };
      }
      function serializeArg(arg) {
        return { name: arg._name || arg.name(), required: arg.required };
      }
      function serializeCommand(cmd, prefix) {
        const name = prefix ? `${prefix} ${cmd.name()}` : cmd.name();
        const result = {};
        if (cmd.commands && cmd.commands.length > 0) {
          for (const sub of cmd.commands) Object.assign(result, serializeCommand(sub, name));
        } else {
          result[name] = {
            description: cmd.description() || '',
            arguments: (cmd.registeredArguments || []).map(serializeArg),
            options: (cmd.options || []).map(serializeOption),
          };
        }
        return result;
      }

      const schema = {
        version: program.version(),
        globalOptions: program.options.map(serializeOption),
        commands: {},
      };
      for (const cmd of program.commands) {
        if (cmd.name() === 'schema' || cmd.name() === 'help') continue;
        Object.assign(schema.commands, serializeCommand(cmd, ''));
      }

      if (cmdOpts.command) {
        if (!schema.commands[cmdOpts.command]) {
          process.stderr.write(`[error] Unknown command: ${cmdOpts.command}\n`);
          process.exit(7);
        }
        schema.commands = { [cmdOpts.command]: schema.commands[cmdOpts.command] };
      }

      process.stdout.write(JSON.stringify(schema, null, 2) + '\n');
    });
};
