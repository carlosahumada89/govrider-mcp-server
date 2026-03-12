// GovRider MCP Server
// Exposes government procurement intelligence to AI agents and LLMs via MCP.
//
// Tools:
//   search_opportunities  - FREE discovery search (sector + metadata, no titles)
//   search_enriched       - Full AI-powered search with Sonnet intelligence (1 credit)
//                           Returns a compact ranked table. Use get_opportunity to drill into any result.
//   get_opportunity        - Get full detail (strategic fit, political context, description, URL) for
//                           a specific result from the last enriched search. FREE (no extra credit).
//   check_credits         - Check remaining credit balance
//
// Config:
//   Environment variable GOVRIDER_API_KEY must be set to a valid GovRider API key.
//   Get one at https://govrider.ai/app/api-keys
//
// Usage (Claude Desktop / Claude Code):
//   {
//     "mcpServers": {
//       "govrider": {
//         "command": "npx",
//         "args": ["-y", "@govrider/mcp-server"],
//         "env": { "GOVRIDER_API_KEY": "gr_live_..." }
//       }
//     }
//   }

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_BASE = process.env.GOVRIDER_API_BASE ?? 'https://www.govrider.ai'
const API_KEY = process.env.GOVRIDER_API_KEY ?? ''

if (!API_KEY) {
  console.error(
    'ERROR: GOVRIDER_API_KEY environment variable is required.\n' +
    'Get your API key at https://govrider.ai/app/api-keys\n' +
    'Then set it in your MCP server config:\n' +
    '  "env": { "GOVRIDER_API_KEY": "gr_live_..." }',
  )
  process.exit(1)
}

// ── Result cache ─────────────────────────────────────────────────────────────
// Stores the last enriched search results so get_opportunity can retrieve
// full details without an extra API call or credit charge.

let cachedMatches: Array<Record<string, unknown>> = []

// ── Helpers ──────────────────────────────────────────────────────────────────

async function apiCall(
  path: string,
  body?: Record<string, unknown>,
  method: 'GET' | 'POST' = 'POST',
): Promise<{
  ok: boolean
  status: number
  data: Record<string, unknown>
}> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  let data: Record<string, unknown>
  try {
    data = (await res.json()) as Record<string, unknown>
  } catch {
    data = { error: 'invalid_response', message: `Server returned ${res.status} with non-JSON body` }
  }

  return { ok: res.ok, status: res.status, data }
}

function errorText(data: Record<string, unknown>, status: number): string {
  const msg = (data.message as string) ?? 'Unknown error'
  if (status === 401) return `Authentication failed: ${msg}. Check your GOVRIDER_API_KEY.`
  if (status === 402) return `No credits remaining. Purchase more at https://govrider.ai/pricing`
  if (status === 429) return `Rate limit exceeded. ${msg}`
  return `Error (${status}): ${msg}`
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'govrider',
  version: '1.2.0',
})

// ── Tool: search_opportunities (FREE) ────────────────────────────────────────

server.registerTool(
  'search_opportunities',
  {
    description:
      'Search government procurement opportunities worldwide. Returns sector category, region, funding type, estimated value, deadline, and status for up to 10 matches. FREE - no credits required. Use this for initial discovery before committing credits to enriched search.',
    inputSchema: {
      query: z
        .string()
        .min(10)
        .max(10000)
        .describe('Description of the technology, product, or service to match against government opportunities (min 10 chars)'),
      region: z
        .string()
        .optional()
        .describe('Filter by region (e.g. "EU", "US Federal", "UK", "Latin America", "Asia Pacific", "Africa")'),
      country: z
        .string()
        .optional()
        .describe('Filter by country (e.g. "France", "Colombia", "Australia")'),
      funding_type: z
        .string()
        .optional()
        .describe('Filter by funding type (e.g. "Tender", "Grant", "RFP", "SBIR/STTR", "Framework")'),
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .describe('Number of results to return (1-10, default 10)'),
    },
  },
  async ({ query, region, country, funding_type, limit }) => {
    const body: Record<string, unknown> = { query }
    const filters: Record<string, string> = {}
    if (region) filters.region = region
    if (country) filters.country = country
    if (funding_type) filters.funding_type = funding_type
    if (Object.keys(filters).length > 0) body.filters = filters
    if (limit) body.limit = limit

    const { ok, status, data } = await apiCall('/api/v1/search', body)

    if (!ok) {
      return { content: [{ type: 'text' as const, text: errorText(data, status) }], isError: true }
    }

    const matches = data.matches as Array<Record<string, unknown>>
    const totalScanned = data.total_scanned as number

    if (!matches || matches.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `No opportunities found matching "${query.slice(0, 100)}". Try broadening your search or removing filters.`,
        }],
      }
    }

    const lines = matches.map((m, i) => {
      const parts = [
        `${i + 1}. **${m.sector}**`,
        `   Region: ${m.region ?? 'Unknown'}`,
        `   Type: ${m.funding_type ?? 'Unknown'}`,
        `   Value: ${m.estimated_value ?? 'Not disclosed'}`,
        `   Deadline: ${m.deadline ?? 'Unknown'}`,
        `   Status: ${m.status}`,
        `   ID: ${m.id}`,
      ]
      return parts.join('\n')
    })

    const header = `Found ${matches.length} opportunities (scanned ${totalScanned?.toLocaleString() ?? '?'} active listings):\n`
    const footer = '\n---\nUse **search_enriched** with the same query to get full AI analysis, match scores, titles, descriptions, and application URLs (costs 1 credit).'

    return {
      content: [{ type: 'text' as const, text: header + lines.join('\n\n') + footer }],
    }
  },
)

// ── Tool: search_enriched (1 credit) ─────────────────────────────────────────

server.registerTool(
  'search_enriched',
  {
    description:
      'Full AI-powered government procurement search with Claude Sonnet intelligence. Returns a compact ranked summary of 10 matches showing title, match score, region, type, value, and deadline. Costs 1 credit. After reviewing the summary, use **get_opportunity** with a result number (1-10) to see the full strategic fit memo, political context memo, description, and application URL for any match - at no extra cost.',
    inputSchema: {
      query: z
        .string()
        .min(20)
        .max(10000)
        .describe('Detailed description of the technology, product, or service (min 20 chars). More detail = better matches.'),
      region: z
        .string()
        .optional()
        .describe('Filter by region (e.g. "EU", "US Federal", "UK", "Latin America", "Asia Pacific", "Africa")'),
      country: z
        .string()
        .optional()
        .describe('Filter by country (e.g. "France", "Colombia", "Australia")'),
      funding_type: z
        .string()
        .optional()
        .describe('Filter by funding type (e.g. "Tender", "Grant", "RFP", "SBIR/STTR", "Framework")'),
    },
  },
  async ({ query, region, country, funding_type }) => {
    const body: Record<string, unknown> = { query }
    const filters: Record<string, string> = {}
    if (region) filters.region = region
    if (country) filters.country = country
    if (funding_type) filters.funding_type = funding_type
    if (Object.keys(filters).length > 0) body.filters = filters

    const { ok, status, data } = await apiCall('/api/v1/search/enriched', body)

    if (!ok) {
      return { content: [{ type: 'text' as const, text: errorText(data, status) }], isError: true }
    }

    const matches = data.matches as Array<Record<string, unknown>>
    const totalScanned = data.total_scanned as number
    const creditsRemaining = data.credits_remaining as number | null

    if (!matches || matches.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: `No opportunities found matching your query. Try broadening your search or removing filters.`,
        }],
      }
    }

    // Cache full results for get_opportunity
    cachedMatches = matches

    // Return compact summary table
    const lines = matches.map((m, i) => {
      return `| ${i + 1} | ${m.displayTitle} | ${m.matchPercentage}% | ${m.region}${m.country ? ` (${m.country})` : ''} | ${m.funding_type ?? '-'} | ${m.estimated_value ?? '-'} | ${m.deadline ?? 'TBD'} |`
    })

    const table = [
      `# GovRider Search Results`,
      '',
      `Found ${matches.length} AI-ranked opportunities (scanned ${totalScanned?.toLocaleString() ?? '?'} active listings):`,
      '',
      '| # | Opportunity | Match | Region | Type | Value | Deadline |',
      '|---|-------------|-------|--------|------|-------|----------|',
      ...lines,
      '',
      '---',
      `Credits remaining: ${creditsRemaining ?? 'unknown'}`,
      '',
      'Use **get_opportunity** with a number (1-10) to see the full strategic fit memo, political context, description, and application URL for any match above.',
    ].join('\n')

    return {
      content: [{ type: 'text' as const, text: table }],
    }
  },
)

// ── Tool: get_opportunity (FREE - reads from cache) ──────────────────────────

server.registerTool(
  'get_opportunity',
  {
    description:
      'Get full details for a specific opportunity from the last enriched search. Returns the strategic fit memo, political context memo, full description, application URL, agency, keywords, and status. FREE - no extra credit cost. You must run search_enriched first.',
    inputSchema: {
      number: z
        .number()
        .min(1)
        .max(10)
        .describe('The result number from the enriched search (1-10)'),
    },
  },
  async ({ number }) => {
    if (cachedMatches.length === 0) {
      return {
        content: [{
          type: 'text' as const,
          text: 'No search results available. Run **search_enriched** first to get matches, then use this tool to view details.',
        }],
        isError: true,
      }
    }

    const index = number - 1
    if (index >= cachedMatches.length) {
      return {
        content: [{
          type: 'text' as const,
          text: `Result #${number} does not exist. The last search returned ${cachedMatches.length} results. Choose a number between 1 and ${cachedMatches.length}.`,
        }],
        isError: true,
      }
    }

    const m = cachedMatches[index]

    const parts = [
      `# ${number}. ${m.displayTitle}`,
      '',
      `**Match Score:** ${m.matchPercentage}%`,
      '',
      `## Opportunity Details`,
      `**Official Title:** ${m.title}`,
      `**Agency:** ${m.agency}`,
      `**Region:** ${m.region}${m.country ? ` (${m.country})` : ''}`,
      `**Type:** ${m.funding_type ?? 'Unknown'}`,
      `**Estimated Value:** ${m.estimated_value ?? 'Not disclosed'}`,
      `**Deadline:** ${m.deadline ?? 'Unknown'}`,
      `**Status:** ${m.status}`,
      `**Last Verified:** ${m.last_verified_at ?? 'Unknown'}`,
      '',
      `## Strategic Fit Memo`,
      (m.context as string) ?? 'Not available',
      '',
      `## Political Context Memo`,
      (m.politicalContext as string) ?? 'Not available',
    ]

    if (m.description) {
      parts.push('', `## Description`, m.description as string)
    }

    if (m.application_url) {
      parts.push('', `## Apply`, `${m.application_url}`)
    }

    if (m.keywords && (m.keywords as string[]).length > 0) {
      parts.push('', `**Keywords:** ${(m.keywords as string[]).join(', ')}`)
    }

    return {
      content: [{ type: 'text' as const, text: parts.join('\n') }],
    }
  },
)

// ── Tool: check_credits ──────────────────────────────────────────────────────

server.registerTool(
  'check_credits',
  {
    description:
      'Check your GovRider credit balance. Each enriched search costs 1 credit. Discovery search and opportunity details are free.',
    inputSchema: {},
  },
  async () => {
    const { ok, status, data } = await apiCall('/api/v1/credits', undefined, 'GET')

    if (!ok) {
      return {
        content: [{ type: 'text' as const, text: errorText(data, status) }],
        isError: true,
      }
    }

    const credits = data.credits as number
    const totalScanned = data.total_scanned as number

    return {
      content: [{
        type: 'text' as const,
        text: [
          `Credits remaining: ${credits}`,
          `Database: ${totalScanned?.toLocaleString() ?? '?'} active opportunities indexed`,
          '',
          'Pricing:',
          '- search_opportunities: FREE (sector + metadata only)',
          '- search_enriched: 1 credit (compact ranked summary of 10 matches)',
          '- get_opportunity: FREE (full details for any match from last search)',
          '- Buy credits: https://govrider.ai/pricing',
        ].join('\n'),
      }],
    }
  },
)

// ── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('GovRider MCP server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error starting GovRider MCP server:', error)
  process.exit(1)
})
