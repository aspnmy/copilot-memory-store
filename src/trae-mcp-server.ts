/**
 * @fileoverview MCP Server for Gmem.
 *
 * A Model Context Protocol server that provides integration between
 * Gmem and the Copilot Memory Store. This server extends the existing
 * memory capabilities with Gmem-specific features.
 *
 * ## Tools
 * - gmem_write: Add a memory with Gmem-specific metadata
 * - gmem_search: Search memories with Gmem-specific filters
 * - gmem_compress: Compress context for Gmem tasks
 * - gmem_inject_context: Auto-inject context for Gmem tasks
 *
 * ## Resources
 * - gmem://stats: Statistics about Gmem-specific memories
 * - gmem://recent: Recent Gmem memories
 *
 * @module gmem-mcp-server
 * @version 0.1.0
 * @see https://modelcontextprotocol.io/
 */

import "dotenv/config";
import process from "node:process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addMemory, computeStats, formatSearchResults, loadStore, search } from "./memoryStore.js";
import { deepSeekCompress, deepSeekShape } from "./deepseek.js";
import { createConfigManager, Config } from "./config.js";

/**
 * Logs a message to stderr (stdout is reserved for JSON-RPC).
 * @param msg - Message to log
 */
function log(msg: string): void {
  process.stderr.write(`[gmem-memory] ${msg}\n`);
}

/**
 * MCP server instance for Gmem with name, version, and capabilities.
 *
 * This server provides integration between Gmem and the memory store:
 * - Gmem-specific memory operations
 * - Context compression for Gmem tasks
 * - Gmem-specific metadata support
 */
const server = new McpServer(
  { name: "gmem-memory-store", version: "0.1.0" },
  {
    capabilities: {},
    instructions: `
# Gmem Memory Store

A persistent memory system for Gmem. Use this to remember decisions,
preferences, patterns, and context across Gmem interactions.

## Quick Start
- **Save something**: Use \`gmem_write\` with text and optional tags
- **Find memories**: Use \`gmem_search\` with a query
- **Get context**: Use \`gmem_inject_context\` before starting a Gmem task

## Best Practices
- Tag memories for better organization (e.g., "gmem", "decision", "preference")
- Use \`gmem_inject_context\` at the start of tasks to retrieve relevant context
- Periodically review with \`gmem://stats\` and \`gmem://recent\` resources
    `.trim()
  }
);

// ─────────────────────────────────────────────────────────────
// MCP Tools - actions clients can invoke
// ─────────────────────────────────────────────────────────────

/**
 * Tool: gmem_write
 *
 * Adds a new memory to the store with Gmem-specific metadata.
 * Keywords are automatically extracted from the text for search indexing.
 *
 * @example
 * // Simple memory
 * gmem_write({ text: "Use TypeScript strict mode", gmemType: "preference" })
 *
 * // Memory with tags
 * gmem_write({ text: "API uses REST conventions", tags: ["gmem", "architecture", "api"], gmemType: "decision" })
 */
server.registerTool(
  "gmem_write",
  {
    title: "Write Gmem Memory",
    description: "Add, save, store, or remember information to the Gmem memory. Use this when you want to remember something specific to Gmem, save a preference, store a decision, or add a note for later.",
    inputSchema: {
      text: z.string().min(1).describe("The memory text to store. Be descriptive - this will be searchable later."),
      tags: z.array(z.string()).optional().describe("Optional tags for categorization (e.g., 'gmem', 'decision', 'preference', 'architecture'). Helps with organization and filtering."),
      gmemType: z.string().optional().describe("Gmem-specific type (e.g., 'preference', 'decision', 'fact', 'emotional')."),
      gmemMetadata: z.record(z.string(), z.any()).optional().describe("Additional Gmem-specific metadata.")
    },
    annotations: {
      title: "Write Gmem Memory",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async (args) => {
    const text = String(args.text ?? "").trim();
    let tags = Array.isArray(args.tags) ? args.tags.map((t) => String(t)) : [];
    
    // Add 'gmem' tag if not already present
    if (!tags.includes("gmem")) {
      tags.push("gmem");
    }
    
    // Add gmemType to tags if provided
    if (typeof args.gmemType === "string" && args.gmemType.trim()) {
      tags.push(args.gmemType.trim());
    }

    const rec = await addMemory({ text, tags });
    const tagInfo = rec.tags.length > 0 ? ` with tags [${rec.tags.join(", ")}]` : "";
    return {
      content: [{
        type: "text",
        text: `✓ Memory saved for Gmem (${rec.id})${tagInfo}\n\nKeywords extracted: ${rec.keywords.slice(0, 5).join(", ")}${rec.keywords.length > 5 ? "..." : ""}`
      }]
    };
  }
);

/**
 * Tool: gmem_search
 *
 * Searches memories by keyword query with relevance scoring, filtered for Gmem-specific content.
 *
 * @example
 * // Find architecture decisions
 * gmem_search({ query: "architecture patterns" })
 *
 * // Get raw JSON for programmatic processing
 * gmem_search({ query: "API design", raw: true, limit: 5 })
 */
server.registerTool(
  "gmem_search",
  {
    title: "Search Gmem Memories",
    description: "Search, find, recall, or look up information from Gmem memory. Filters results to include only Gmem-related memories.",
    inputSchema: {
      query: z.string().min(1).describe("Search query - matches against memory text, keywords, and tags."),
      limit: z.number().min(1).max(50).default(10).describe("Maximum results to return (1-50, default 10)."),
      raw: z.boolean().default(false).describe("Return raw JSON instead of formatted markdown. Useful for programmatic processing."),
      gmemType: z.string().optional().describe("Filter by Gmem-specific type."),
      includeNonGmem: z.boolean().default(false).describe("Include non-Gmem memories in results.").default(false)
    },
    annotations: {
      title: "Search Gmem Memories",
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
    const gmemType = typeof args.gmemType === "string" ? args.gmemType.trim() : undefined;
    const includeNonGmem = Boolean(args.includeNonGmem);
    
    const loaded = loadStore();
    let hits = search(loaded.records, q, limit * 2); // Get more results to filter
    
    // Filter results for Gmem-specific memories
    if (!includeNonGmem) {
      hits = hits.filter(hit => hit.tags.includes("gmem"));
    }
    
    // Filter by gmemType if provided
    if (gmemType) {
      hits = hits.filter(hit => hit.tags.includes(gmemType));
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
 * Tool: gmem_compress
 *
 * Creates a budget-constrained markdown context block from relevant Gmem memories.
 *
 * @example
 * // Basic compression
 * gmem_compress({ query: "testing strategy" })
 *
 * // With LLM enhancement
 * gmem_compress({ query: "API design", llm: true, budget: 2000 })
 */
server.registerTool(
  "gmem_compress",
  {
    title: "Compress Gmem Context",
    description: "Create a compact Markdown context block from relevant Gmem memories, constrained to a character budget.",
    inputSchema: {
      query: z.string().min(1).describe("Search query to find relevant Gmem memories."),
      budget: z.number().min(200).max(8000).default(1200).describe("Character budget for output (200-8000, default 1200)."),
      limit: z.number().min(1).max(50).default(25).describe("Max memories to consider before compression (1-50, default 25)."),
      llm: z.boolean().default(false).describe("Use DeepSeek LLM for smarter compression. Requires DEEPSEEK_API_KEY env var."),
      includeNonGmem: z.boolean().default(false).describe("Include non-Gmem memories in results.").default(false)
    },
    annotations: {
      title: "Compress Gmem Context",
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
    const includeNonGmem = Boolean(args.includeNonGmem);

    const loaded = loadStore();
    let hits = search(loaded.records, query, limit * 2); // Get more results to filter
    
    // Filter results for Gmem-specific memories
    if (!includeNonGmem) {
      hits = hits.filter(hit => hit.tags.includes("gmem"));
    }
    
    // Limit results
    hits = hits.slice(0, limit);

    // Create context from filtered hits
    const lines: string[] = [];
    lines.push("# Gmem Context (auto)");
    lines.push("");
    lines.push("## Relevant memories");
    for (const h of hits) {
      const tagStr = h.tags.length ? ` [${h.tags.join(", ")}]` : "";
      lines.push(`- (${h.id})${tagStr} ${h.text}`);
    }

    let md = lines.join("\n") + "\n";

    if (llm) {
      const configManager = createConfigManager();
      const key = configManager.getDeepSeekApiKey();
      if (key) {
        const baseUrl = configManager.getDeepSeekBaseUrl();
        const model = configManager.getDeepSeekModel();
        md = await deepSeekCompress({ baseUrl, apiKey: key, model }, query, md, budget);
      }
    }

    return { content: [{ type: "text", text: md }] };
  }
);

/**
 * Tool: gmem_inject_context
 *
 * Automatically injects relevant Gmem memories as shaped context for a task.
 *
 * @example
 * // Before implementing a feature
 * gmem_inject_context({ task: "implement user authentication with OAuth", gmemType: "decision" })
 *
 * // With larger budget for complex tasks
 * gmem_inject_context({ task: "refactor the database layer", budget: 3000 })
 */
server.registerTool(
  "gmem_inject_context",
  {
    title: "Inject Gmem Task Context",
    description: "Inject relevant Gmem context for a task. Call this BEFORE starting work to retrieve Gmem-specific decisions, preferences, and constraints.",
    inputSchema: {
      task: z.string().min(1).describe("The task you are about to work on. Be specific for better context matching."),
      budget: z.number().min(200).max(8000).default(1500).describe("Character budget for context output (200-8000, default 1500)."),
      limit: z.number().min(1).max(50).default(25).describe("Maximum memories to consider for context (1-50, default 25)."),
      gmemType: z.string().optional().describe("Filter by Gmem-specific type."),
      includeNonGmem: z.boolean().default(false).describe("Include non-Gmem memories in context.").default(false)
    },
    annotations: {
      title: "Inject Gmem Task Context",
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
    const gmemType = typeof args.gmemType === "string" ? args.gmemType.trim() : undefined;
    const includeNonGmem = Boolean(args.includeNonGmem);

    const loaded = loadStore();
    let hits = search(loaded.records, task, limit * 2); // Get more results to filter
    
    // Filter results for Gmem-specific memories
    if (!includeNonGmem) {
      hits = hits.filter(hit => hit.tags.includes("gmem"));
    }
    
    // Filter by gmemType if provided
    if (gmemType) {
      hits = hits.filter(hit => hit.tags.includes(gmemType));
    }
    
    // Limit results
    hits = hits.slice(0, limit);

    // Create context from filtered hits
    const lines: string[] = [];
    lines.push("# Gmem Context (auto)");
    lines.push("");
    lines.push("## Relevant memories");
    for (const h of hits) {
      const tagStr = h.tags.length ? ` [${h.tags.join(", ")}]` : "";
      lines.push(`- (${h.id})${tagStr} ${h.text}`);
    }

    let contextBlock = lines.join("\n") + "\n";
    let shapingMethod = "deterministic";

    // Attempt DeepSeek shaping for intelligent context transformation
    const configManager = createConfigManager();
    const apiKey = configManager.getDeepSeekApiKey();
    if (apiKey) {
      const baseUrl = configManager.getDeepSeekBaseUrl();
      const model = configManager.getDeepSeekModel();
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
 * Resource: gmem://stats
 *
 * Returns statistics about Gmem-specific memories.
 *
 * @returns Markdown table with statistics
 */
server.registerResource(
  "gmem-stats",
  "gmem://stats",
  {
    description: "Statistics about Gmem-specific memories. Shows counts and top tags by usage.",
    mimeType: "text/markdown"
  },
  async () => {
    const loaded = loadStore();
    
    // Filter for Gmem-specific memories
    const gmemRecords = loaded.records.filter(r => r.tags.includes("gmem"));
    const s = computeStats(gmemRecords);

    const lines: string[] = [];
    lines.push("# Gmem Memory Store Statistics\n");
    lines.push("Real-time overview of your Gmem memory store.\n");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Gmem memories | ${s.total} |`);
    lines.push(`| Active | ${s.active} |`);
    lines.push(`| Soft-deleted | ${s.deleted} |`);

    const tagEntries = Object.entries(s.tags).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (tagEntries.length > 0) {
      lines.push("\n## Top 10 Tags\n");
      lines.push("Most frequently used tags for Gmem memories.\n");
      lines.push(`| Tag | Usage Count |`);
      lines.push(`|-----|-------------|`);
      for (const [tag, count] of tagEntries) {
        lines.push(`| \`${tag}\` | ${count} |`);
      }
    } else {
      lines.push("\n_No tags in use yet. Add tags to Gmem memories for better organization._");
    }

    return { contents: [{ uri: "gmem://stats", mimeType: "text/markdown", text: lines.join("\n") }] };
  }
);

/**
 * Resource: gmem://recent
 *
 * Returns the 10 most recently added Gmem-specific memories.
 *
 * @returns Markdown list of recent Gmem memories
 */
server.registerResource(
  "gmem-recent",
  "gmem://recent",
  {
    description: "The 10 most recently added Gmem-specific memories, sorted by creation date.",
    mimeType: "text/markdown"
  },
  async () => {
    const loaded = loadStore();
    const active = loaded.records
      .filter(r => !r.deletedAt && r.tags.includes("gmem"))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    const lines: string[] = [];
    lines.push("# Recent Gmem Memories\n");
    lines.push("Last 10 Gmem memories added to the store.\n");

    if (active.length === 0) {
      lines.push("_No Gmem memories stored yet._\n");
      lines.push("Use `gmem_write` to add your first Gmem memory!");
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

    return { contents: [{ uri: "gmem://recent", mimeType: "text/markdown", text: lines.join("\n") }] };
  }
);

// ─────────────────────────────────────────────────────────────
// Server startup
// ─────────────────────────────────────────────────────────────

/**
 * Starts the MCP server with stdio transport.
 * Logs status to stderr since stdout is used for JSON-RPC.
 */

/**
 * 解析命令行参数
 * 支持格式：--KEY=value 或 --KEY value
 */
function parseCommandLineArgs(): Partial<Config> {
  const args: Partial<Config> = {};
  const cliArgs = process.argv.slice(2);
  
  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];
    
    // 支持 --KEY=value 格式
    if (arg.startsWith("--") && arg.includes("=")) {
      const [key, value] = arg.slice(2).split("=", 2);
      args[key as keyof Config] = value;
    }
    // 支持 --KEY value 格式
    else if (arg.startsWith("--") && i + 1 < cliArgs.length && !cliArgs[i + 1].startsWith("--")) {
      const key = arg.slice(2);
      args[key as keyof Config] = cliArgs[i + 1];
      i++; // 跳过下一个参数，因为已经被使用了
    }
  }
  
  return args;
}

async function main(): Promise<void> {
  // 解析命令行参数并覆盖配置
  const cliArgs = parseCommandLineArgs();
  if (Object.keys(cliArgs).length > 0) {
    const configManager = createConfigManager();
    configManager.override(cliArgs);
    
    // 更新 process.env 以便 memoryStore.ts 中的函数能够使用覆盖后的配置
    for (const key in cliArgs) {
      const value = cliArgs[key as keyof Config];
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
    
    log(`配置参数覆盖: ${JSON.stringify(cliArgs)}`);
  }
  
  const transport = new StdioServerTransport();
  log("Starting Gmem MCP stdio server...");
  await server.connect(transport);
  log("Gmem MCP server connected.");
}

main().catch((err) => {
  log(`Fatal: ${err?.message || String(err)}`);
  process.exit(1);
});
