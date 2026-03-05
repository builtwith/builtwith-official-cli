'use strict';

/**
 * MCP (Model Context Protocol) stdio server.
 * Implements JSON-RPC 2.0 over stdin/stdout — no SDK dependency.
 *
 * stdout = JSON-RPC channel (never write anything else here)
 * stderr = debug/error logging only
 */

const { requireKey } = require('../config');
const { request } = require('../client');
const { EXIT_CODES } = require('../errors');

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'domain_lookup',
    description: 'Look up the technology stack and metadata for a domain using the BuiltWith Domain API.',
    inputSchema: {
      type: 'object',
      properties: {
        domain:   { type: 'string',  description: 'Domain to look up (e.g. "shopify.com")' },
        nopii:    { type: 'boolean', description: 'Exclude PII data' },
        nometa:   { type: 'boolean', description: 'Exclude meta data' },
        noattr:   { type: 'boolean', description: 'Exclude attribution data' },
        liveonly: { type: 'boolean', description: 'Only return currently-live technologies' },
        fdrange:  { type: 'string',  description: 'First-detected range (YYYYMMDD-YYYYMMDD)' },
        ldrange:  { type: 'string',  description: 'Last-detected range (YYYYMMDD-YYYYMMDD)' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'lists_tech',
    description: 'Get a list of domains currently using a specific technology.',
    inputSchema: {
      type: 'object',
      properties: {
        tech:   { type: 'string',  description: 'Technology name (e.g. "WordPress", "Shopify")' },
        offset: { type: 'number', description: 'Result offset for pagination (default 0)' },
        limit:  { type: 'number', description: 'Number of results (default 20)' },
      },
      required: ['tech'],
    },
  },
  {
    name: 'relationships_lookup',
    description: 'Find domains related to a given domain (shared infrastructure, ownership, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to look up relationships for' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'free_lookup',
    description: 'Free-tier category and group technology counts for a domain.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to look up' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'company_find',
    description: 'Find domains and web properties associated with a company name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Company name to search for' },
      },
      required: ['name'],
    },
  },
  {
    name: 'tags_lookup',
    description: 'Find domains related to an IP address or other tag attributes.',
    inputSchema: {
      type: 'object',
      properties: {
        lookup: { type: 'string', description: 'IP address or tag value to look up' },
      },
      required: ['lookup'],
    },
  },
  {
    name: 'recommendations_lookup',
    description: 'Get technology recommendations for a domain based on its current stack.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to get recommendations for' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'redirects_lookup',
    description: 'Get live and historical redirect chains for a domain.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to look up redirects for' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'keywords_lookup',
    description: 'Get keyword data associated with a domain.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to look up keywords for' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'trends_tech',
    description: 'Get historical trend data showing adoption of a technology over time.',
    inputSchema: {
      type: 'object',
      properties: {
        tech: { type: 'string', description: 'Technology name (e.g. "React", "WordPress")' },
      },
      required: ['tech'],
    },
  },
  {
    name: 'products_search',
    description: 'Search for ecommerce products across BuiltWith-indexed stores.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string',  description: 'Product search query' },
        page:  { type: 'number', description: 'Page number (default 1)' },
        limit: { type: 'number', description: 'Results per page (default 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'trust_lookup',
    description: 'Get a trust/quality score for a domain.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain to score' },
      },
      required: ['domain'],
    },
  },
  {
    name: 'account_whoami',
    description: 'Return the identity and details of the authenticated BuiltWith account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'account_usage',
    description: 'Return API usage statistics for the authenticated BuiltWith account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─── Tool call handler ───────────────────────────────────────────────────────

async function callTool(name, args, key, debug) {
  const opts = { debug };

  switch (name) {
    case 'domain_lookup': {
      const params = { KEY: key, LOOKUP: args.domain };
      if (args.nopii)    params.NOPII    = true;
      if (args.nometa)   params.NOMETA   = true;
      if (args.noattr)   params.NOATTR   = true;
      if (args.liveonly) params.LIVEONLY  = true;
      if (args.fdrange)  params.FDRANGE  = args.fdrange;
      if (args.ldrange)  params.LDRANGE  = args.ldrange;
      return request('domain', params, opts);
    }
    case 'lists_tech':
      return request('lists', { KEY: key, TECH: args.tech, OFFSET: args.offset || 0, LIMIT: args.limit || 20 }, opts);
    case 'relationships_lookup':
      return request('relationships', { KEY: key, LOOKUP: args.domain }, opts);
    case 'free_lookup':
      return request('free', { KEY: key, LOOKUP: args.domain }, opts);
    case 'company_find':
      return request('company', { KEY: key, COMPANY: args.name }, opts);
    case 'tags_lookup':
      return request('tags', { KEY: key, LOOKUP: args.lookup }, opts);
    case 'recommendations_lookup':
      return request('recommendations', { KEY: key, LOOKUP: args.domain }, opts);
    case 'redirects_lookup':
      return request('redirects', { KEY: key, LOOKUP: args.domain }, opts);
    case 'keywords_lookup':
      return request('keywords', { KEY: key, LOOKUP: args.domain }, opts);
    case 'trends_tech':
      return request('trends', { KEY: key, TECH: args.tech }, opts);
    case 'products_search':
      return request('products', { KEY: key, QUERY: args.query, PAGE: args.page || 1, LIMIT: args.limit || 20 }, opts);
    case 'trust_lookup':
      return request('trust', { KEY: key, LOOKUP: args.domain }, opts);
    case 'account_whoami':
      return request('whoami', { KEY: key }, opts);
    case 'account_usage':
      return request('usage', { KEY: key }, opts);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ─── JSON-RPC helpers ────────────────────────────────────────────────────────

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function respond(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function respondError(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

// ─── Commander registration ──────────────────────────────────────────────────

module.exports = function registerMcp(program) {
  program
    .command('mcp')
    .description('Start an MCP stdio server exposing BuiltWith API as tools')
    .action(async () => {
      const opts = program.opts();
      const debug = opts.debug || false;

      // Resolve API key upfront — fail fast before stdio server starts
      let key;
      try {
        key = requireKey(opts.key);
      } catch (err) {
        process.stderr.write(`[builtwith-mcp] ${err.message}\n`);
        process.exit(EXIT_CODES.AUTH);
      }

      if (debug) process.stderr.write('[builtwith-mcp] Server starting on stdio\n');

      // Read stdin line-by-line (JSON-RPC 2.0)
      let buffer = '';
      process.stdin.setEncoding('utf8');
      process.stdin.resume();

      process.stdin.on('data', (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          handleLine(trimmed, key, debug);
        }
      });

      process.stdin.on('end', () => {
        process.exit(EXIT_CODES.SUCCESS);
      });
    });
};

async function handleLine(line, key, debug) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch (_) {
    respondError(null, -32700, 'Parse error');
    return;
  }

  if (debug) process.stderr.write(`[builtwith-mcp] recv: ${line}\n`);

  const { id, method, params } = msg;

  // Notifications (no id) — acknowledge and ignore
  if (id === undefined || id === null) {
    return;
  }

  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'builtwith', version: '1.0.0' },
        capabilities: { tools: {} },
      });
      break;

    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;

    case 'tools/call': {
      const toolName = params && params.name;
      const toolArgs = (params && params.arguments) || {};
      try {
        const data = await callTool(toolName, toolArgs, key, debug);
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify(data) }],
        });
      } catch (err) {
        respond(id, {
          isError: true,
          content: [{ type: 'text', text: err.message }],
        });
      }
      break;
    }

    default:
      respondError(id, -32601, `Method not found: ${method}`);
  }
}
