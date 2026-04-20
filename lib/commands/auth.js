'use strict';

const fetch = require('node-fetch');
const output = require('../output');

const AUTH_START_URL = 'https://api.builtwith.com/agent-auth-start';
const AUTH_TOKEN_URL = 'https://api.builtwith.com/agent-auth-token';
const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 5 * 60 * 1000;

module.exports = function registerAuth(program) {
  const auth = program.command('auth').description('Agent Device-Code Authorization – obtain a temporary API token');

  auth
    .command('login')
    .description('Authorize this agent to use the BuiltWith API via browser approval')
    .action(async () => {
      const opts = program.opts();
      if (opts.noColor) output.setNoColor(true);

      // Step 1: start the device-code flow
      let startRes;
      try {
        const res = await fetch(AUTH_START_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        });
        startRes = await res.json();
      } catch (err) {
        output.error(`Failed to start authorization: ${err.message}`);
        process.exit(1);
      }

      const { device_code, verification_uri } = startRes;
      if (!device_code || !verification_uri) {
        output.error('Unexpected response from authorization server.');
        process.exit(1);
      }

      // Step 2: prompt user to open the browser
      process.stderr.write(`\nOpen this URL in your browser to authorize access:\n\n  ${verification_uri}\n\nWaiting for approval`);

      // Step 3: poll every 5 seconds
      const deadline = Date.now() + TIMEOUT_MS;
      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        process.stderr.write('.');

        let tokenRes;
        try {
          const res = await fetch(AUTH_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_code }),
          });
          tokenRes = await res.json();
        } catch (err) {
          output.error(`\nPolling error: ${err.message}`);
          process.exit(1);
        }

        if (tokenRes.access_token) {
          process.stderr.write('\n\n');
          output.print({ access_token: tokenRes.access_token, message: 'Authorization approved. Use this token as your BW_API_KEY.' }, { format: opts.format });
          return;
        }

        if (tokenRes.error === 'access_denied') {
          process.stderr.write('\n');
          output.error('Authorization was denied by the user.');
          process.exit(1);
        }
        // error === 'authorization_pending' — keep polling
      }

      process.stderr.write('\n');
      output.error('Authorization timed out after 5 minutes.');
      process.exit(1);
    });
};
