import "dotenv/config";
import { loadStore, exportJson } from "./memoryStore.js";
import fs from "node:fs";
import path from "node:path";

/**
 * 自动备份记忆的定时器脚本
 * 定期自动备份记忆数据到指定目录
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
 * 备份配置接口
 */
interface BackupConfig {
  interval: number;
  format: "json" | "markdown" | "csv" | "plain_text" | "embedding_ready";
  backupDir: string;
  maxBackups: number;
  compress: boolean;
}

/**
 * 默认备份配置
 */
const defaultConfig: BackupConfig = {
  interval: 3600000,
  format: "json",
  backupDir: path.join(process.cwd(), "backups"),
  maxBackups: 10,
  compress: false
};

/**
 * 从环境变量加载配置
 */
function loadConfig(): BackupConfig {
  const config: BackupConfig = { ...defaultConfig };
  
  if (process.env.BACKUP_INTERVAL) {
    config.interval = parseInt(process.env.BACKUP_INTERVAL, 10);
  }
  
  if (process.env.BACKUP_FORMAT) {
    const format = process.env.BACKUP_FORMAT.toLowerCase();
    if (["json", "markdown", "csv", "plain_text", "embedding_ready"].includes(format)) {
      config.format = format as BackupConfig["format"];
    }
  }
  
  if (process.env.BACKUP_DIR) {
    config.backupDir = process.env.BACKUP_DIR;
  }
  
  if (process.env.MAX_BACKUPS) {
    config.maxBackups = parseInt(process.env.MAX_BACKUPS, 10);
  }
  
  if (process.env.COMPRESS_BACKUPS) {
    config.compress = process.env.COMPRESS_BACKUPS.toLowerCase() === "true";
  }
  
  return config;
}

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
 * 根据格式导出记忆
 */
function exportMemories(records: MemoryRecord[], format: BackupConfig["format"]): string {
  switch (format) {
    case "json":
      return exportToJson(records);
    case "markdown":
      return exportToMarkdown(records);
    case "csv":
      return exportToCsv(records);
    case "plain_text":
      return exportToPlainText(records);
    case "embedding_ready":
      return exportToEmbeddingReady(records);
    default:
      throw new Error(`不支持的格式: ${format}`);
  }
}

/**
 * 获取文件扩展名
 */
function getFileExtension(format: BackupConfig["format"]): string {
  switch (format) {
    case "json":
      return "json";
    case "markdown":
      return "md";
    case "csv":
      return "csv";
    case "plain_text":
      return "txt";
    case "embedding_ready":
      return "jsonl";
    default:
      throw new Error(`不支持的格式: ${format}`);
  }
}

/**
 * 清理旧的备份文件
 */
function cleanOldBackups(backupDir: string, maxBackups: number): void {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith("memory-backup-"))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`✓ 已删除旧备份: ${file.name}`);
      }
    }
  } catch (error) {
    console.error("清理旧备份失败:", error);
  }
}

/**
 * 执行备份
 */
async function performBackup(config: BackupConfig): Promise<void> {
  try {
    console.log(`\n[${new Date().toLocaleString()}] 开始备份记忆...`);
    
    const { records } = loadStore();
    const activeRecords = records.filter(r => !r.deletedAt);
    
    console.log(`找到 ${activeRecords.length} 条活跃记忆`);
    
    const content = exportMemories(activeRecords, config.format);
    const extension = getFileExtension(config.format);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `memory-backup-${timestamp}.${extension}`;
    const backupPath = path.join(config.backupDir, filename);
    
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
      console.log(`✓ 已创建备份目录: ${config.backupDir}`);
    }
    
    fs.writeFileSync(backupPath, content, "utf-8");
    
    console.log(`✓ 备份已保存到: ${backupPath}`);
    console.log(`✓ 格式: ${config.format}`);
    console.log(`✓ 文件大小: ${content.length} 字节`);
    
    cleanOldBackups(config.backupDir, config.maxBackups);
    
    console.log(`✓ 备份完成，最多保留 ${config.maxBackups} 个备份文件`);
    
  } catch (error) {
    console.error("备份失败:", error);
  }
}

/**
 * 启动自动备份定时器
 */
function startAutoBackup(config: BackupConfig): void {
  console.log("=".repeat(60));
  console.log("自动备份记忆服务已启动");
  console.log("=".repeat(60));
  console.log(`备份间隔: ${config.interval / 1000} 秒`);
  console.log(`备份格式: ${config.format}`);
  console.log(`备份目录: ${config.backupDir}`);
  console.log(`最大备份数: ${config.maxBackups}`);
  console.log("=".repeat(60));
  
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
    console.log(`✓ 已创建备份目录: ${config.backupDir}`);
  }
  
  performBackup(config);
  
  const intervalId = setInterval(() => {
    performBackup(config);
  }, config.interval);
  
  console.log(`✓ 定时器已设置，每 ${config.interval / 1000} 秒自动备份一次\n`);
  
  process.on("SIGINT", () => {
    console.log("\n\n收到停止信号，正在关闭自动备份服务...");
    clearInterval(intervalId);
    console.log("✓ 自动备份服务已停止");
    process.exit(0);
  });
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const config = loadConfig();
  
  if (process.argv.includes("--once")) {
    console.log("执行一次性备份...\n");
    await performBackup(config);
    process.exit(0);
  }
  
  startAutoBackup(config);
}

main();
