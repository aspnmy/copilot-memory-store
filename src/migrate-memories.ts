import "dotenv/config";
import { loadStore, exportJson } from "./memoryStore.js";
import fs from "node:fs";
import path from "node:path";

/**
 * 记忆移植工具
 * 支持将记忆导出为不同格式，以便在其他模型/工具中使用
 */

type MemoryRecord = {
  id: string;
  text: string;
  tags: string[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/**
 * 导出为 JSON 格式
 */
function exportToJson(records: MemoryRecord[]): string {
  return exportJson(records);
}

/**
 * 导出为 Markdown 格式
 */
function exportToMarkdown(records: MemoryRecord[]): string {
  const lines: string[] = [];
  lines.push("# 记忆导出\n");
  lines.push(`导出时间: ${new Date().toISOString()}`);
  lines.push(`总记忆数: ${records.length}\n`);
  
  for (const record of records) {
    lines.push(`## ${record.id}`);
    lines.push(`**标签**: ${record.tags.join(", ")}`);
    lines.push(`**关键词**: ${record.keywords.join(", ")}`);
    lines.push(`**创建时间**: ${record.createdAt}`);
    lines.push(`\n${record.text}\n`);
  }
  
  return lines.join("\n");
}

/**
 * 导出为 CSV 格式
 */
function exportToCsv(records: MemoryRecord[]): string {
  const headers = ["id", "text", "tags", "keywords", "createdAt", "updatedAt", "deletedAt"];
  const rows = [headers.join(",")];
  
  for (const record of records) {
    const row = [
      record.id,
      `"${record.text.replace(/"/g, '""')}"`,
      `"${record.tags.join(", ")}"`,
      `"${record.keywords.join(", ")}"`,
      record.createdAt,
      record.updatedAt,
      record.deletedAt || ""
    ];
    rows.push(row.join(","));
  }
  
  return rows.join("\n");
}

/**
 * 导出为纯文本格式
 */
function exportToPlainText(records: MemoryRecord[]): string {
  const lines: string[] = [];
  
  for (const record of records) {
    lines.push(`ID: ${record.id}`);
    lines.push(`标签: ${record.tags.join(", ")}`);
    lines.push(`关键词: ${record.keywords.join(", ")}`);
    lines.push(`创建时间: ${record.createdAt}`);
    lines.push(`\n${record.text}`);
    lines.push("\n" + "=".repeat(50) + "\n");
  }
  
  return lines.join("\n");
}

/**
 * 导出为嵌入向量准备格式
 * 用于 LLM 嵌入和语义搜索
 */
function exportToEmbeddingReady(records: MemoryRecord[]): string {
  const lines: string[] = [];
  
  for (const record of records) {
    const embeddingData = {
      id: record.id,
      text: record.text,
      metadata: {
        tags: record.tags,
        keywords: record.keywords,
        createdAt: record.createdAt
      }
    };
    lines.push(JSON.stringify(embeddingData));
  }
  
  return lines.join("\n");
}

/**
 * 主导出函数
 */
async function exportMemories(format: ExportFormat = ExportFormat.JSON) {
  try {
    console.log("加载记忆数据...\n");
    
    // 加载记忆存储
    const { records } = loadStore();
    const activeRecords = records.filter(r => !r.deletedAt);
    
    console.log(`找到 ${activeRecords.length} 条活跃记忆\n`);
    
    // 根据格式导出
    let content: string;
    let extension: string;
    
    switch (format) {
      case "json":
        content = exportToJson(activeRecords);
        extension = "json";
        break;
      case "markdown":
        content = exportToMarkdown(activeRecords);
        extension = "md";
        break;
      case "csv":
        content = exportToCsv(activeRecords);
        extension = "csv";
        break;
      case "plain_text":
        content = exportToPlainText(activeRecords);
        extension = "txt";
        break;
      case "embedding_ready":
        content = exportToEmbeddingReady(activeRecords);
        extension = "jsonl";
        break;
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
    
    // 保存到文件
    const filename = `memories-export-${Date.now()}.${extension}`;
    const exportPath = path.join(process.cwd(), filename);
    fs.writeFileSync(exportPath, content, "utf-8");
    
    console.log(`✓ 记忆已导出到: ${exportPath}`);
    console.log(`✓ 格式: ${format}`);
    console.log(`✓ 总共导出 ${activeRecords.length} 条记忆`);
    console.log(`✓ 文件大小: ${content.length} 字节`);
    
    return exportPath;
    
  } catch (error) {
    console.error("导出失败:", error);
    throw error;
  }
}

// 从命令行参数获取导出格式
const formatArg = process.argv[2]?.toLowerCase();
let format: ExportFormat = ExportFormat.JSON;

switch (formatArg) {
  case "json":
    format = ExportFormat.JSON;
    break;
  case "markdown":
  case "md":
    format = ExportFormat.MARKDOWN;
    break;
  case "csv":
    format = ExportFormat.CSV;
    break;
  case "text":
  case "txt":
    format = ExportFormat.PLAIN_TEXT;
    break;
  case "embedding":
  case "jsonl":
    format = ExportFormat.EMBEDDING_READY;
    break;
  default:
    console.log("用法: npx tsx src/migrate-memories.ts [格式]");
    console.log("支持的格式: json, markdown, csv, text, embedding");
    console.log("默认格式: json\n");
}

exportMemories(format);