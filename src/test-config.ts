import { createConfigManager } from "./config.js";
import "dotenv/config";

console.log("=== 配置管理模块测试 ===\n");

// 测试 1: 从 .env 加载配置
console.log("测试 1: 从 .env 加载配置");
const configManager1 = createConfigManager();
console.log("MEMORY_PATH:", configManager1.getMemoryPath());
console.log("DEEPSEEK_API_KEY:", configManager1.getDeepSeekApiKey() ? "已设置" : "未设置");
console.log("BACKUP_INTERVAL:", configManager1.getBackupInterval());
console.log("BACKUP_FORMAT:", configManager1.getBackupFormat());
console.log("BACKUP_DIR:", configManager1.getBackupDir());
console.log("MAX_BACKUPS:", configManager1.getMaxBackups());
console.log("COMPRESS_BACKUPS:", configManager1.getCompressBackups());
console.log("hasDeepSeekConfig:", configManager1.hasDeepSeekConfig());
console.log();

// 测试 2: 使用参数覆盖配置
console.log("测试 2: 使用参数覆盖配置");
const configManager2 = createConfigManager({
  MEMORY_PATH: "custom-memory.json",
  DEEPSEEK_API_KEY: "test-api-key",
  BACKUP_INTERVAL: "7200000",
  BACKUP_FORMAT: "markdown",
  BACKUP_DIR: "./custom-backups",
  MAX_BACKUPS: "20",
  COMPRESS_BACKUPS: "true"
});
console.log("MEMORY_PATH:", configManager2.getMemoryPath());
console.log("DEEPSEEK_API_KEY:", configManager2.getDeepSeekApiKey());
console.log("BACKUP_INTERVAL:", configManager2.getBackupInterval());
console.log("BACKUP_FORMAT:", configManager2.getBackupFormat());
console.log("BACKUP_DIR:", configManager2.getBackupDir());
console.log("MAX_BACKUPS:", configManager2.getMaxBackups());
console.log("COMPRESS_BACKUPS:", configManager2.getCompressBackups());
console.log("hasDeepSeekConfig:", configManager2.hasDeepSeekConfig());
console.log();

// 测试 3: 部分覆盖
console.log("测试 3: 部分覆盖（只覆盖部分配置）");
const configManager3 = createConfigManager({
  MEMORY_PATH: "partial-memory.json",
  BACKUP_FORMAT: "csv"
});
console.log("MEMORY_PATH:", configManager3.getMemoryPath());
console.log("DEEPSEEK_API_KEY:", configManager3.getDeepSeekApiKey() ? "已设置" : "未设置");
console.log("BACKUP_INTERVAL:", configManager3.getBackupInterval());
console.log("BACKUP_FORMAT:", configManager3.getBackupFormat());
console.log("BACKUP_DIR:", configManager3.getBackupDir());
console.log("MAX_BACKUPS:", configManager3.getMaxBackups());
console.log("COMPRESS_BACKUPS:", configManager3.getCompressBackups());
console.log();

// 测试 4: 获取所有配置
console.log("测试 4: 获取所有配置");
const configManager4 = createConfigManager();
console.log("所有配置:", JSON.stringify(configManager4.getAll(), null, 2));
console.log();

// 测试 5: 默认值测试
console.log("测试 5: 默认值测试");
const configManager5 = createConfigManager();
console.log("getMemoryPath('default.json'):", configManager5.getMemoryPath("default.json"));
console.log("getDeepSeekBaseUrl('https://custom.api.com'):", configManager5.getDeepSeekBaseUrl("https://custom.api.com"));
console.log("getDeepSeekModel('custom-model'):", configManager5.getDeepSeekModel("custom-model"));
console.log("getBackupInterval(5000000):", configManager5.getBackupInterval(5000000));
console.log("getBackupFormat('markdown'):", configManager5.getBackupFormat("markdown"));
console.log("getBackupDir('./custom-dir'):", configManager5.getBackupDir("./custom-dir"));
console.log("getMaxBackups(50):", configManager5.getMaxBackups(50));
console.log("getCompressBackups(true):", configManager5.getCompressBackups(true));
console.log();

console.log("=== 所有测试完成 ===");
