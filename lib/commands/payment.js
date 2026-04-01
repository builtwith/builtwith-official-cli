'use strict';

const { requireKey } = require('../config');
const { request } = require('../client');
const { InputError } = require('../errors');
const output = require('../output');
const ora = require('ora');

module.exports = function registerPayment(program) {
  const payment = program.command('payment').description('Agent Payment API – manage and purchase API credits');

  payment
    .command('balance')
    .description('Get current credit balance')
    .action(async () => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key };
      const spinner = opts.quiet ? null : ora({ text: 'Fetching credit balance...', stream: process.stderr }).start();
      try {
        const data = await request('payment-balance', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });

  payment
    .command('config')
    .description('Retrieve payment configuration (limits, pricing)')
    .action(async () => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const params = { KEY: key };
      const spinner = opts.quiet ? null : ora({ text: 'Fetching payment config...', stream: process.stderr }).start();
      try {
        const data = await request('payment-config', params, { dryRun: opts.dryRun, debug: opts.debug, spinner });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });

  payment
    .command('purchase <credits>')
    .description('Purchase API credits (minimum 2000)')
    .action(async (creditsArg) => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);
      const key = requireKey(opts.key);
      const credits = parseInt(creditsArg, 10);
      if (isNaN(credits) || credits < 2000) throw new InputError('credits must be an integer of at least 2000');
      const params = { KEY: key };
      const spinner = opts.quiet ? null : ora({ text: `Purchasing ${credits} credits...`, stream: process.stderr }).start();
      try {
        const data = await request('payment-purchase', params, { dryRun: opts.dryRun, debug: opts.debug, spinner, method: 'POST', body: { credits } });
        output.print(data, { format: opts.format, fields: opts.fields });
      } catch (err) {
        if (spinner) spinner.stop();
        throw err;
      }
    });
};
