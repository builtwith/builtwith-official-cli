# BuiltWith CLI 🔍

> Non-interactive, scriptable CLI for the [BuiltWith API](https://api.builtwith.com) — designed for automation, CI/CD pipelines, and AI agent consumption.

```bash
bw domain lookup shopify.com --format table
bw domain lookup shopify.com --nopii | jq '.Results[0].Technologies[].Name'
bw change lookup shopify.com --since "last month"
bw live feed --duration 60 > events.ndjson
bw mcp   # start MCP server for Claude Desktop, VS Code, etc.
```

## 🤔 Why this exists

The [BuiltWith TUI](https://github.com/builtwith/builtwith-tui) is great for interactive exploration. This CLI is intentionally different:

- **stdout = data only** (JSON/table/CSV) — safe to pipe anywhere
- **stderr = human output** (spinners, errors, debug info)
- **Structured exit codes** — scripts can distinguish auth failures from rate limits from network errors
- **Multiple auth paths** — works in CI with env vars, locally with rc files, or inline with `--key`

---

## 📦 Installation

```bash
npm install -g builtwith-official-cli
```

Or run directly without installing:

```bash
npx builtwith-official-cli domain lookup example.com --key YOUR_KEY
```

Registers as both `bw` (short) and `builtwith` (discoverable).

---

## 🔑 Authentication

API key is resolved in priority order:

| Priority | Method |
|---|---|
| 1 | `--key <value>` CLI flag |
| 2 | `BUILTWITH_API_KEY` environment variable |
| 3 | `.builtwithrc` in current directory |
| 4 | `.builtwithrc` in home directory |

`.env` files in the current directory are loaded automatically, so `BUILTWITH_API_KEY=xxx` in `.env` works too.

**`.builtwithrc` format:**
```json
{"key": "YOUR_API_KEY"}
```

Copy `.builtwithrc.example` to get started:
```bash
cp .builtwithrc.example ~/.builtwithrc
# then edit with your key
```

---

## 💻 Commands

### 🌐 Domain

```bash
bw domain lookup <domain> [flags]
```

| Flag | Description |
|---|---|
| `--nopii` | Exclude PII data |
| `--nometa` | Exclude meta data |
| `--noattr` | Exclude attribution data |
| `--liveonly` | Only currently-live technologies |
| `--fdrange <YYYYMMDD-YYYYMMDD>` | First-detected date range |
| `--ldrange <YYYYMMDD-YYYYMMDD>` | Last-detected date range |

```bash
bw domain lookup shopify.com
bw domain lookup shopify.com --format table
bw domain lookup shopify.com --nopii --liveonly | jq '.Results[0].Technologies[].Name'
bw domain lookup shopify.com --fdrange 20240101-20241231
```

### 🔄 Change

```bash
bw change lookup <domain[,domain2]> [--since <date>]
```

```bash
bw change lookup shopify.com
bw change lookup shopify.com,builtwith.com --since "last month"
```

### 📋 Lists

```bash
bw lists tech <tech> [--other-techs <names>] [--country <codes>] [--since <date>] [--revenue <filter>] [--spend <filter>] [--offset <n>] [--limit <n>]
```

```bash
bw lists tech WordPress
bw lists tech Shopify --limit 50 --offset 100
bw lists tech Google-Analytics --other-techs Meta-Pixel
bw lists tech Shopify --revenue "100000|GT" --spend "100|GTE" --country US
```

Lists numeric filters use `number|operator`, where operator is `EQ`, `LT`, `LTE`, `GT`, or `GTE`. Supported attribute filters include `--spend`, `--revenue`, `--sku`, `--followers`, `--employees`, `--sitemap`, `--page-rank`, `--bw-rank`, `--tranco`, `--majestic`, `--bws`, `--ecat`, `--aim`, `--aio`, `--air`, and `--aiv`.

### 🔗 Relationships

```bash
bw relationships lookup <domain>
```

### 🆓 Free

```bash
bw free lookup <domain>
```

### 🏢 Company

```bash
bw company find <name>
```

```bash
bw company find "Shopify"
```

### 🏷️ Tags

```bash
bw tags lookup <lookup>
```

### 💡 Recommendations

```bash
bw recommendations lookup <domain>
```

### ↪️ Redirects

```bash
bw redirects lookup <domain>
```

### 🔤 Keywords

```bash
bw keywords lookup <domain>
```

### 📈 Trends

```bash
bw trends tech <tech>
```

```bash
bw trends tech React
```

### 🛍️ Products

```bash
bw products search <query> [--page <n>] [--limit <n>]
```

```bash
bw products search "coffee maker"
bw products search "running shoes" --page 2 --limit 50
```

### 🛡️ Trust

```bash
bw trust lookup <domain>
```

### 🔎 Vector Search

```bash
bw vector search <query> [--limit <n>]
```

```bash
bw vector search "react framework"
bw vector search "ecommerce platform" --limit 20
```

### 💬 Ask

Natural language website list lookup — ask a plain-English question and get back matching domains.

```bash
bw ask search <query> [--commit] [--next-offset <token>] [--meta]
```

| Flag | Description |
|---|---|
| `--commit` | Run a full report (up to 1,000 results; uses more API credits) |
| `--next-offset <token>` | Pagination token from a previous response's `NextOffset` field |
| `--meta` | Include metadata in results |

```bash
bw ask search "Magento websites in Spain"
bw ask search "Shopify stores selling pet products" --commit
bw ask search "React e-commerce sites" --commit --next-offset <token>
```

Without `--commit`, every request returns a quick sample — great for previewing before running a full report.

### 🔐 Auth

Obtain a temporary `bw-` prefixed API token via browser approval — no API key needed to run this command.

```bash
bw auth login
```

Flow:
1. Prints a `builtwith.com` URL — open it in your browser and click **Approve**
2. Polls automatically every 5 seconds
3. Prints the `access_token` (`bw-...`) on approval — use it as `BW_API_KEY`

### 💳 Payment

Manage API credits autonomously.

```bash
bw payment balance           # current credit balance
bw payment config            # limits, pricing, monthly usage
bw payment purchase <credits> # purchase credits (minimum 2000)
```

```bash
bw payment balance
bw payment purchase 2000
```

### 👤 Account

```bash
bw account whoami
bw account usage
```

### 📡 Live Feed

Stream live technology detection events as [NDJSON](https://jsonlines.org/), one event per line.

```bash
bw live feed [--duration <seconds>]
```

```bash
# Stream indefinitely (Ctrl+C to stop)
bw live feed

# Capture 60 seconds of events
bw live feed --duration 60 > events.ndjson

# Pipe to jq in real time
bw live feed | jq --unbuffered '.domain'
```

---

## 🚩 Global Flags

Available on every command:

| Flag | Description |
|---|---|
| `--key <apikey>` | API key (highest priority) |
| `--format <fmt>` | `json` (default) \| `table` \| `csv` |
| `--no-color` | Disable color on stderr |
| `--dry-run` | Print request URL (key masked) and exit |
| `--debug` | Print HTTP metadata to stderr |
| `--quiet` | Suppress spinner/info stderr output |

---

## 🖨️ Output Formats

### JSON (default)

```bash
bw domain lookup example.com | jq '.Results[0].Technologies[].Name'
```

### Table

```bash
bw domain lookup example.com --format table
```

### CSV

```bash
bw domain lookup example.com --format csv > results.csv
```

---

## 🚦 Exit Codes

Scripts can use exit codes to handle different failure modes:

| Code | Meaning |
|---|---|
| `0` | ✅ Success |
| `1` | 💥 Unexpected error |
| `2` | 🔐 Auth failure (missing key, 401, 403) |
| `3` | 🔍 Not found (404) |
| `4` | ⏱️ Rate limit (429) |
| `5` | ⚠️ Other API error |
| `6` | 🌐 Network failure |
| `7` | ❌ Invalid input |
| `8` | 🛑 Interrupted (SIGINT) |

```bash
bw domain lookup example.com
case $? in
  0) echo "success" ;;
  2) echo "check your API key" ;;
  4) echo "rate limited — slow down" ;;
  6) echo "network error" ;;
esac
```

---

## 🔧 Pipeline Examples

```bash
# Get all live tech names for a domain
bw domain lookup shopify.com --liveonly | \
  jq -r '.Results[0].Technologies[].Name' | sort

# Check if a domain uses WordPress
bw domain lookup example.com --quiet --liveonly | \
  jq -e '.Results[0].Technologies[] | select(.Name == "WordPress")' > /dev/null \
  && echo "uses WordPress"

# Export tech stack to CSV
bw domain lookup shopify.com --format csv > shopify-tech.csv

# Capture 5 minutes of live events
bw live feed --duration 300 --quiet > feed.ndjson

# Find all sites using a technology (paginated)
for offset in 0 20 40 60 80; do
  bw domain lists tech React --offset $offset --limit 20 --quiet
done | jq -s 'add'

# CI/CD: fail build if domain check fails
bw domain lookup mysite.com --key "$BUILTWITH_API_KEY" --quiet || exit 1
```

---

## 🐛 Dry Run & Debugging

```bash
# Preview the URL that would be called (key is masked)
bw domain lookup example.com --key MYKEY --dry-run
# → https://api.builtwith.com/v22/api.json?KEY=REDACTED&LOOKUP=example.com

# See HTTP response metadata
bw domain lookup example.com --debug
```

---

## 🤖 MCP Server

`bw mcp` starts a [Model Context Protocol](https://modelcontextprotocol.io) server over stdio, exposing all BuiltWith API endpoints as structured tools that any MCP-compatible client can call — Claude Desktop, VS Code, Cursor, Zed, and more.

```bash
bw mcp
bw mcp --key YOUR_API_KEY   # pass key inline instead of env/rc file
bw mcp --debug              # log JSON-RPC traffic to stderr
```

### ⚙️ Client configuration

Add to your MCP client config (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "builtwith": {
      "command": "bw",
      "args": ["mcp"]
    }
  }
}
```

If your API key isn't in an env var or `.builtwithrc`, pass it inline:

```json
{
  "mcpServers": {
    "builtwith": {
      "command": "bw",
      "args": ["mcp", "--key", "YOUR_API_KEY"]
    }
  }
}
```

### 🧰 Available tools

| Tool | Description |
|---|---|
| `domain_lookup` | 🌐 Technology stack for a domain (supports `nopii`, `liveonly`, date ranges) |
| `change_lookup` | 🔄 Technology additions and removals for one or more domains |
| `lists_tech` | 📋 Domains currently using a technology |
| `relationships_lookup` | 🔗 Related domains (shared infra, ownership) |
| `free_lookup` | 🆓 Free-tier category counts for a domain |
| `company_find` | 🏢 Domains associated with a company name |
| `tags_lookup` | 🏷️ Domains related to an IP or tag attribute |
| `recommendations_lookup` | 💡 Technology recommendations for a domain |
| `redirects_lookup` | ↪️ Live and historical redirect chains |
| `keywords_lookup` | 🔤 Keyword data for a domain |
| `trends_tech` | 📈 Historical adoption trend for a technology |
| `products_search` | 🛍️ Search ecommerce products across indexed stores |
| `trust_lookup` | 🛡️ Trust/quality score for a domain |
| `vector_search` | 🔎 Semantic search across technologies and categories |
| `ask_search` | 💬 Natural language website list lookup |
| `payment_balance` | 💳 Get current Agent Payment API credit balance |
| `payment_config` | ⚙️ Retrieve payment limits and pricing configuration |
| `payment_purchase` | 🛒 Purchase API credits (minimum 2000) |
| `account_whoami` | 👤 Authenticated account identity |
| `account_usage` | 📊 API usage statistics |
| `agent-auth-start` | 🔐 Start Device-Code Authorization (no API key required) |
| `agent-auth-token` | 🔐 Poll for authorization result and access token (no API key required) |

### 🔬 Implementation note

The MCP server is implemented as a pure JSON-RPC 2.0 stdio server with no additional dependencies — auth, HTTP calls, and error handling all use the same code paths as the regular CLI commands.

---

## 🛠️ Development

```bash
git clone https://github.com/builtwith/builtwith-cli
cd builtwith-cli
npm install
npm test        # 24 tests, node:test built-in (no extra framework)
```

```bash
# Run without installing globally
node bin/bw.js domain lookup example.com --key YOUR_KEY
```

---

## 🔗 Related

- [BuiltWith TUI](https://github.com/builtwith/builtwith-tui) — interactive terminal UI for the BuiltWith API
- [BuiltWith API Docs](https://api.builtwith.com) — full API reference

---

## 📄 License

MIT
