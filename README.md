<p align="center">
  <h1 align="center">GovRider MCP Server</h1>
</p>

<p align="center">
  Match your tech product or consulting service to thousands of live government tenders, RFPs, grants, and frameworks from 25+ official sources worldwide.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@govrider/mcp-server"><img src="https://img.shields.io/npm/v/@govrider/mcp-server?color=00f5ff&label=npm" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@govrider/mcp-server"><img src="https://img.shields.io/npm/dm/@govrider/mcp-server?color=0066ff&label=downloads" alt="npm downloads"></a>
  <a href="https://github.com/carlosahumada89/govrider-mcp-server/blob/main/LICENSE"><img src="https://img.shields.io/github/license/carlosahumada89/govrider-mcp-server" alt="license"></a>
  <a href="https://govrider.ai"><img src="https://img.shields.io/badge/govrider.ai-live-39ff14" alt="GovRider"></a>
</p>

---

## What is GovRider?

GovRider is for **any tech company, consultancy, or individual** with a technology product or service. You don't need to be a government specialist. If you build or sell technology, there are governments looking to buy it.

- **Thousands of live opportunities** from 25+ official government portals and international organisations
- **Covers** the US, EU, UK, Latin America, Africa, and Asia Pacific
- **Updated nightly** - only live, open opportunities are returned
- **AI-enriched** - every opportunity is verified, analysed, and semantically indexed
- **Describe what you sell** or what you are building and get ranked matches in seconds

---

## Quick Start

### 1. Get an API key

Sign up at [govrider.ai](https://govrider.ai) and create an API key at [govrider.ai/app/api-keys](https://govrider.ai/app/api-keys).

### 2. Install

<details open>
<summary><strong>Claude Desktop</strong></summary>

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "govrider": {
      "command": "npx",
      "args": ["-y", "@govrider/mcp-server"],
      "env": {
        "GOVRIDER_API_KEY": "gr_live_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.
</details>

<details>
<summary><strong>Claude Code</strong></summary>

Add to `.claude/settings.json` in your project or `~/.claude/settings.json` globally:

```json
{
  "mcpServers": {
    "govrider": {
      "command": "npx",
      "args": ["-y", "@govrider/mcp-server"],
      "env": {
        "GOVRIDER_API_KEY": "gr_live_your_key_here"
      }
    }
  }
}
```
</details>

<details>
<summary><strong>VS Code / Cursor</strong></summary>

Add to your workspace `.vscode/mcp.json`:

```json
{
  "servers": {
    "govrider": {
      "command": "npx",
      "args": ["-y", "@govrider/mcp-server"],
      "env": {
        "GOVRIDER_API_KEY": "gr_live_your_key_here"
      }
    }
  }
}
```
</details>

---

## Tools

### `search_opportunities` (FREE)

Discovery search across all sources. No credits required.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Description of your technology, product, or service (min 10 chars) |
| `region` | string | No | Filter: "EU", "US Federal", "UK", "Latin America", "Asia Pacific", "Africa" |
| `country` | string | No | Filter: "France", "Colombia", "Australia", etc. |
| `funding_type` | string | No | Filter: "Tender", "Grant", "RFP", "SBIR/STTR", "Framework" |
| `limit` | number | No | Results to return, 1-10 (default 10) |

**Returns for each match:**
- Sector category
- Region
- Funding type
- Estimated value
- Deadline
- Status

---

### `search_enriched` (1 credit)

High precision matching via GovRider's proprietary AI architecture.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Detailed description of your technology, product, or service (min 20 chars). More detail = better matches. |
| `region` | string | No | Filter: "EU", "US Federal", "UK", "Latin America", "Asia Pacific", "Africa" |
| `country` | string | No | Filter: "France", "Colombia", "Australia", etc. |
| `funding_type` | string | No | Filter: "Tender", "Grant", "RFP", "SBIR/STTR", "Framework" |

**Returns for each match (10 results):**
- Match score (0-100)
- GovRider's strategic fit memo assessing your tech solution or consulting offer suitability
- GovRider's political context analysis of opportunities identified
- Translated English title
- Full description
- Agency and country
- Direct application URL
- Document URLs
- Keywords
- Deadline and estimated value

---

### `check_credits`

Check your GovRider credit balance and database status. No parameters required.

---

## Configuration

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `GOVRIDER_API_KEY` | Yes | Your GovRider API key. Get one at [govrider.ai/app/api-keys](https://govrider.ai/app/api-keys) |
| `GOVRIDER_API_BASE` | No | Override API base URL (default: `https://www.govrider.ai`) |

---

## Examples

GovRider works by matching **what you sell or build** against live government opportunities. Describe your product or service, and GovRider finds where the demand is.

### Tech product

> *"We build a cloud-based ERP platform for finance teams. Key modules include budget forecasting, procurement workflow automation, and real-time spend analytics. We integrate with SAP and any cloud provider via API."*

### Tech consulting

> *"Our firm provides cybersecurity advisory and implementation services: penetration testing, SOC setup, zero-trust architecture design, and GDPR/NIS2 compliance audits. We specialise in critical infrastructure and defence clients."*

---

## Coverage

- Data from **25+ official government portals** and **international organisations**
- Regions: US, EU, UK, Latin America, Africa, Asia Pacific
- All data is refreshed **nightly**
- Only **live, open** opportunities are returned

---

## Pricing

| Tool | Cost |
|------|------|
| `search_opportunities` | **Free** |
| `search_enriched` | **1 credit** |
| `check_credits` | **Free** |

Buy credits at [govrider.ai/pricing](https://govrider.ai/pricing).

---

## Security

- API keys are transmitted over HTTPS only
- Keys are never stored in plaintext on GovRider's servers (SHA-256 hashed)
- Rate limit: 60 requests per minute per API key
- Report security issues to [contact@govrider.ai](mailto:contact@govrider.ai)

---

## Development

```bash
# Clone
git clone https://github.com/carlosahumada89/govrider-mcp-server.git
cd govrider-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run locally
GOVRIDER_API_KEY=gr_live_... node build/index.js
```

---

## License

MIT - see [LICENSE](LICENSE).

---

<p align="center">
  <a href="https://govrider.ai">govrider.ai</a> -
  <a href="https://govrider.ai/pricing">Pricing</a> -
  <a href="mailto:contact@govrider.ai">Contact</a>
</p>
