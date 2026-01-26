/**
 * @fileoverview MCP Server for Trae.
 *
 * A Model Context Protocol server that provides integration between
 * Trae and the Copilot Memory Store. This server extends the existing
 * memory capabilities with Trae-specific features.
 *
 * ## Tools
 * - trae_write: Add a memory with Trae-specific metadata
 * - trae_search: Search memories with Trae-specific filters
 * - trae_compress: Compress context for Trae tasks
 * - trae_inject_context: Auto-inject context for Trae tasks
 *
 * ## Resources
 * - trae://stats: Statistics about Trae-specific memories
 * - trae://recent: Recent Trae memories
 *
 * @module trae-mcp-server
 * @version 0.1.0
 * @see https://modelcontextprotocol.io/
 */

import "dotenv/config";
import process from "node:process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addMemory, compressDeterministic, computeStats, exportJson, formatSearchResults, loadStore, purge, search, softDeleteById } from "./memoryStore.js";
import { deepSeekCompress, deepSeekShape } from "./deepseek.js";

/**
 * Logs a message to stderr (stdout is reserved for JSON-RPC).
 * @param msg - Message to log
 */
function log(msg: string): void {
  process.stderr.write(`[trae-memory] ${msg}\n`);
}

/**
 * MCP server instance for Trae with name, version, and capabilities.
 *
 * This server provides integration between Trae and the memory store:
 * - Trae-specific memory operations
 * - Context compression for Trae tasks
 * - Trae-specific metadata support
 */
const server = new McpServer(
  { name: "trae-memory-store", version: "0.1.0" },
  {
    capabilities: {},
    instructions: `
# Trae Memory Store

A persistent memory system for Trae. Use this to remember decisions,
preferences, patterns, and context across Trae interactions.

## Quick Start
- **Save something**: Use \`trae_write\` with text and optional tags
- **Find memories**: Use \`trae_search\` with a query
- **Get context**: Use \`trae_inject_context\` before starting a Trae task

## Best Practices
- Tag memories for better organization (e.g., "trae", "decision", "preference")
- Use \`trae_inject_context\` at the start of tasks to retrieve relevant context
- Periodically review with \`trae://stats\` and \`trae://recent\` resources
    `.trim()
  }
);

// ─────────────────────────────────────────────────────────────
// MCP Tools - actions clients can invoke
// ─────────────────────────────────────────────────────────────

/**
 * Tool: trae_write
 *
 * Adds a new memory to the store with Trae-specific metadata.
 * Keywords are automatically extracted from the text for search indexing.
 *
 * @example
 * // Simple memory
 * trae_write({ text: "Use TypeScript strict mode", traeType: "preference" })
 *
 * // Memory with tags
 * trae_write({ text: "API uses REST conventions", tags: ["trae", "architecture", "api"], traeType: "decision" })
 */
server.registerTool(
  "trae_write",
  {
    title: "Write Trae Memory",
    description: "Add, save, store, or remember information to the Trae memory. Use this when you want to remember something specific to Trae, save a preference, store a decision, or add a note for later.",
    inputSchema: {
      text: z.string().min(1).describe("The memory text to store. Be descriptive - this will be searchable later."),
      tags: z.array(z.string()).optional().describe("Optional tags for categorization (e.g., 'trae', 'decision', 'preference', 'architecture'). Helps with organization and filtering."),
      traeType: z.string().optional().describe("Trae-specific type (e.g., 'preference', 'decision', 'fact', 'emotional')."),
      traeMetadata: z.record(z.string(), z.any()).optional().describe("Additional Trae-specific metadata.")
    },
    annotations: {
      title: "Write Trae Memory",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async (args) => {
    const text = String(args.text ?? "").trim();
    let tags = Array.isArray(args.tags) ? args.tags.map((t) => String(t)) : [];
    
    // Add 'trae' tag if not already present
    if (!tags.includes("trae")) {
      tags.push("trae");
    }
    
    // Add traeType to tags if provided
    if (typeof args.traeType === "string" && args.traeType.trim()) {
      tags.push(args.traeType.trim());
    }

    const rec = await addMemory({ text, tags });
    const tagInfo = rec.tags.length > 0 ? ` with tags [${rec.tags.join(", ")}]` : "";
    return {
      content: [{
        type: "text",
        text: `✓ Memory saved for Trae (${rec.id})${tagInfo}\n\nKeywords extracted: ${rec.keywords.slice(0, 5).join(", ")}${rec.keywords.length > 5 ? "..." : ""}`
      }]
    };
  }
);

/**
 * Tool: trae_search
 *
 * Searches memories by keyword query with relevance scoring, filtered for Trae-specific content.
 *
 * @example
 * // Find architecture decisions
 * trae_search({ query: "architecture patterns" })
 *
 * // Get raw JSON for programmatic processing
 * trae_search({ query: "API design", raw: true, limit: 5 })
 */
server.registerTool(
  "trae_search",
  {
    title: "Search Trae Memories",
    description: "Search, find, recall, or look up information from Trae memory. Filters results to include only Trae-related memories.",
    inputSchema: {
      query: z.string().min(1).describe("Search query - matches against memory text, keywords, and tags."),
      limit: z.number().min(1).max(50).default(10).describe("Maximum results to return (1-50, default 10)."),
      raw: z.boolean().default(false).describe("Return raw JSON instead of formatted markdown. Useful for programmatic processing."),
      traeType: z.string().optional().describe("Filter by Trae-specific type."),
      includeNonTrae: z.boolean().default(false).describe("Include non-Trae memories in results.").default(false)
    },
    annotations: {
      title: "Search Trae Memories",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (args) => {
    const q = String(args.query ?? "").trim();
    const limit = Number.isFinite(args.limit) ? Number(args.limit) : 10;
    const raw = Boolean(args.raw);
    const traeType = typeof args.traeType === "string" ? args.traeType.trim() : undefined;
    const includeNonTrae = Boolean(args.includeNonTrae);
    
    const loaded = loadStore();
    let hits = search(loaded.records, q, limit * 2); // Get more results to filter
    
    // Filter results for Trae-specific memories
    if (!includeNonTrae) {
      hits = hits.filter(hit => hit.tags.includes("trae"));
    }
    
    // Filter by traeType if provided
    if (traeType) {
      hits = hits.filter(hit => hit.tags.includes(traeType));
    }
    
    // Limit results
    hits = hits.slice(0, limit);

    if (raw) {
      return { content: [{ type: "text", text: JSON.stringify({ matches: hits.length, hits }, null, 2) }] };
    }

    const formatted = formatSearchResults(hits, q);
    return { content: [{ type: "text", text: formatted }] };
  }
);

/**
 * Tool: trae_compress
 *
 * Creates a budget-constrained markdown context block from relevant Trae memories.
 *
 * @example
 * // Basic compression
 * trae_compress({ query: "testing strategy" })
 *
 * // With LLM enhancement
 * trae_compress({ query: "API design", llm: true, budget: 2000 })
 */
server.registerTool(
  "trae_compress",
  {
    title: "Compress Trae Context",
    description: "Create a compact Markdown context block from relevant Trae memories, constrained to a character budget.",
    inputSchema: {
      query: z.string().min(1).describe("Search query to find relevant Trae memories."),
      budget: z.number().min(200).max(8000).default(1200).describe("Character budget for output (200-8000, default 1200)."),
      limit: z.number().min(1).max(50).default(25).describe("Max memories to consider before compression (1-50, default 25)."),
      llm: z.boolean().default(false).describe("Use DeepSeek LLM for smarter compression. Requires DEEPSEEK_API_KEY env var."),
      includeNonTrae: z.boolean().default(false).describe("Include non-Trae memories in results.").default(false)
    },
    annotations: {
      title: "Compress Trae Context",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (args) => {
    const query = String(args.query ?? "").trim();
    const budget = Number.isFinite(args.budget) ? Number(args.budget) : 1200;
    const limit = Number.isFinite(args.limit) ? Number(args.limit) : 25;
    const llm = Boolean(args.llm);
    const includeNonTrae = Boolean(args.includeNonTrae);

    const loaded = loadStore();
    let hits = search(loaded.records, query, limit * 2); // Get more results to filter
    
    // Filter results for Trae-specific memories
    if (!includeNonTrae) {
      hits = hits.filter(hit => hit.tags.includes("trae"));
    }
    
    // Limit results
    hits = hits.slice(0, limit);

    // Create context from filtered hits
    const lines: string[] = [];
    lines.push("# Trae Context (auto)");
    lines.push("");
    lines.push("## Relevant memories");
    for (const h of hits) {
      const tagStr = h.tags.length ? ` [${h.tags.join(", ")}]` : "";
      lines.push(`- (${h.id})${tagStr} ${h.text}`);
    }

    let md = lines.join("\n") + "\n";

    if (llm) {
      const key = (process.env.DEEPSEEK_API_KEY || "").trim();
      if (key) {
        const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").trim();
        const model = (process.env.DEEPSEEK_MODEL || "deepseek-chat").trim();
        md = await deepSeekCompress({ baseUrl, apiKey: key, model }, query, md, budget);
      }
    }

    return { content: [{ type: "text", text: md }] };
  }
);

/**
 * Tool: trae_inject_context
 *
 * Automatically injects relevant Trae memories as shaped context for a task.
 *
 * @example
 * // Before implementing a feature
 * trae_inject_context({ task: "implement user authentication with OAuth", traeType: "decision" })
 *
 * // With larger budget for complex tasks
 * trae_inject_context({ task: "refactor the database layer", budget: 3000 })
 */
server.registerTool(
  "trae_inject_context",
  {
    title: "Inject Trae Task Context",
    description: "Inject relevant Trae context for a task. Call this BEFORE starting work to retrieve Trae-specific decisions, preferences, and constraints.",
    inputSchema: {
      task: z.string().min(1).describe("The task you are about to work on. Be specific for better context matching."),
      budget: z.number().min(200).max(8000).default(1500).describe("Character budget for context output (200-8000, default 1500)."),
      limit: z.number().min(1).max(50).default(25).describe("Maximum memories to consider for context (1-50, default 25)."),
      traeType: z.string().optional().describe("Filter by Trae-specific type."),
      includeNonTrae: z.boolean().default(false).describe("Include non-Trae memories in context.").default(false)
    },
    annotations: {
      title: "Inject Trae Task Context",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (args) => {
    const task = String(args.task ?? "").trim();
    if (!task) {
      return {
        content: [{ type: "text", text: "Error: task parameter is required. Describe what you're about to work on." }],
        isError: true
      };
    }

    const budget = Number.isFinite(args.budget) ? Number(args.budget) : 1500;
    const limit = Number.isFinite(args.limit) ? Number(args.limit) : 25;
    const traeType = typeof args.traeType === "string" ? args.traeType.trim() : undefined;
    const includeNonTrae = Boolean(args.includeNonTrae);

    const loaded = loadStore();
    let hits = search(loaded.records, task, limit * 2); // Get more results to filter
    
    // Filter results for Trae-specific memories
    if (!includeNonTrae) {
      hits = hits.filter(hit => hit.tags.includes("trae"));
    }
    
    // Filter by traeType if provided
    if (traeType) {
      hits = hits.filter(hit => hit.tags.includes(traeType));
    }
    
    // Limit results
    hits = hits.slice(0, limit);

    // Create context from filtered hits
    const lines: string[] = [];
    lines.push("# Trae Context (auto)");
    lines.push("");
    lines.push("## Relevant memories");
    for (const h of hits) {
      const tagStr = h.tags.length ? ` [${h.tags.join(", ")}]` : "";
      lines.push(`- (${h.id})${tagStr} ${h.text}`);
    }

    let contextBlock = lines.join("\n") + "\n";
    let shapingMethod = "deterministic";

    // Attempt DeepSeek shaping for intelligent context transformation
    const apiKey = (process.env.DEEPSEEK_API_KEY || "").trim();
    if (apiKey) {
      const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").trim();
      const model = (process.env.DEEPSEEK_MODEL || "deepseek-chat").trim();
      try {
        contextBlock = await deepSeekShape({ baseUrl, apiKey, model }, task, contextBlock, budget);
        shapingMethod = "deepseek";
      } catch (err) {
        // Log error but continue with deterministic fallback
        log(`DeepSeek shaping failed, using deterministic: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Add metadata footer for transparency
    const footer = `\n\n---\n_Context: ${shapingMethod} shaping | ${hits.length} memories | ${contextBlock.length} chars_`;

    return { content: [{ type: "text", text: contextBlock + footer }] };
  }
);

// ─────────────────────────────────────────────────────────────
// MCP Resources - data endpoints clients can fetch proactively
// ─────────────────────────────────────────────────────────────

/**
 * Resource: trae://stats
 *
 * Returns statistics about Trae-specific memories.
 *
 * @returns Markdown table with statistics
 */
server.registerResource(
  "trae-stats",
  "trae://stats",
  {
    description: "Statistics about Trae-specific memories. Shows counts and top tags by usage.",
    mimeType: "text/markdown"
  },
  async () => {
    const loaded = loadStore();
    
    // Filter for Trae-specific memories
    const traeRecords = loaded.records.filter(r => r.tags.includes("trae"));
    const s = computeStats(traeRecords);

    const lines: string[] = [];
    lines.push("# Trae Memory Store Statistics\n");
    lines.push("Real-time overview of your Trae memory store.\n");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Trae memories | ${s.total} |`);
    lines.push(`| Active | ${s.active} |`);
    lines.push(`| Soft-deleted | ${s.deleted} |`);

    const tagEntries = Object.entries(s.tags).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (tagEntries.length > 0) {
      lines.push("\n## Top 10 Tags\n");
      lines.push("Most frequently used tags for Trae memories.\n");
      lines.push(`| Tag | Usage Count |`);
      lines.push(`|-----|-------------|`);
      for (const [tag, count] of tagEntries) {
        lines.push(`| \`${tag}\` | ${count} |`);
      }
    } else {
      lines.push("\n_No tags in use yet. Add tags to Trae memories for better organization._");
    }

    return { contents: [{ uri: "trae://stats", mimeType: "text/markdown", text: lines.join("\n") }] };
  }
);

/**
 * Resource: trae://recent
 *
 * Returns the 10 most recently added Trae-specific memories.
 *
 * @returns Markdown list of recent Trae memories
 */
server.registerResource(
  "trae-recent",
  "trae://recent",
  {
    description: "The 10 most recently added Trae-specific memories, sorted by creation date.",
    mimeType: "text/markdown"
  },
  async () => {
    const loaded = loadStore();
    const active = loaded.records
      .filter(r => !r.deletedAt && r.tags.includes("trae"))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const lines: string[] = [];
    lines.push("# Recent Trae Memories\n");
    lines.push("Last 10 Trae memories added to the store.\n");

    if (active.length === 0) {
      lines.push("_No Trae memories stored yet._\n");
      lines.push("Use `trae_write` to add your first Trae memory!");
    } else {
      for (const r of active) {
        const date = new Date(r.createdAt).toLocaleDateString();
        const time = new Date(r.createdAt).toLocaleTimeString();
        const tagStr = r.tags.length ? ` \`[${r.tags.join(", ")}]\`` : "";
        lines.push(`### ${date} at ${time}${tagStr}`);
        lines.push(`> ${r.text}`);
        lines.push(`_ID: ${r.id}_\n`);
      }
    }

    return { contents: [{ uri: "trae://recent", mimeType: "text/markdown", text: lines.join("\n") }] };
  }
);

// ─────────────────────────────────────────────────────────────
// Server startup
// ─────────────────────────────────────────────────────────────

/**
 * Starts the MCP server with stdio transport.
 * Logs status to stderr since stdout is used for JSON-RPC.
 */
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  log("Starting Trae MCP stdio server...");
  await server.connect(transport);
  log("Trae MCP server connected.");
}

main().catch((err) => {
  log(`Fatal: ${err?.message || String(err)}`);
  process.exit(1);
});
