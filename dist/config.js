import "dotenv/config";
import process from "node:process";
/**
 * 配置管理类
 * 支持参数覆盖 .env 配置
 * 规则：配置参数中存在与 .env 中同名参数则配置参数为准，不存在同名参数则 .env
 */
export class ConfigManager {
    config;
    constructor() {
        this.config = this.loadFromEnv();
    }
    /**
     * 从环境变量加载配置
     */
    loadFromEnv() {
        return {
            MEMORY_PATH: process.env.MEMORY_PATH,
            MEMORY_LOCK_PATH: process.env.MEMORY_LOCK_PATH,
            DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
            DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
            DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
            BACKUP_INTERVAL: process.env.BACKUP_INTERVAL,
            BACKUP_FORMAT: process.env.BACKUP_FORMAT,
            BACKUP_DIR: process.env.BACKUP_DIR,
            MAX_BACKUPS: process.env.MAX_BACKUPS,
            COMPRESS_BACKUPS: process.env.COMPRESS_BACKUPS
        };
    }
    /**
     * 使用参数覆盖配置
     * 规则：配置参数中存在与 .env 中同名参数则配置参数为准，不存在同名参数则 .env
     */
    override(params) {
        for (const key in params) {
            if (params[key] !== undefined) {
                this.config[key] = params[key];
            }
        }
    }
    /**
     * 获取配置值
     */
    get(key) {
        return this.config[key];
    }
    /**
     * 获取所有配置
     */
    getAll() {
        return { ...this.config };
    }
    /**
     * 获取内存路径
     */
    getMemoryPath(defaultPath = "project-memory.json") {
        return (this.config.MEMORY_PATH || defaultPath).trim();
    }
    /**
     * 获取内存锁路径
     */
    getMemoryLockPath() {
        return this.config.MEMORY_LOCK_PATH?.trim();
    }
    /**
     * 获取 DeepSeek API 密钥
     */
    getDeepSeekApiKey() {
        return (this.config.DEEPSEEK_API_KEY || "").trim();
    }
    /**
     * 获取 DeepSeek 基础 URL
     */
    getDeepSeekBaseUrl(defaultUrl = "https://api.deepseek.com") {
        return (this.config.DEEPSEEK_BASE_URL || defaultUrl).trim();
    }
    /**
     * 获取 DeepSeek 模型
     */
    getDeepSeekModel(defaultModel = "deepseek-chat") {
        return (this.config.DEEPSEEK_MODEL || defaultModel).trim();
    }
    /**
     * 获取备份间隔
     */
    getBackupInterval(defaultInterval = 3600000) {
        if (this.config.BACKUP_INTERVAL) {
            const interval = parseInt(this.config.BACKUP_INTERVAL, 10);
            return isNaN(interval) ? defaultInterval : interval;
        }
        return defaultInterval;
    }
    /**
     * 获取备份格式
     */
    getBackupFormat(defaultFormat = "json") {
        return (this.config.BACKUP_FORMAT || defaultFormat).toLowerCase();
    }
    /**
     * 获取备份目录
     */
    getBackupDir(defaultDir = "./backups") {
        return (this.config.BACKUP_DIR || defaultDir).trim();
    }
    /**
     * 获取最大备份数
     */
    getMaxBackups(defaultMax = 10) {
        if (this.config.MAX_BACKUPS) {
            const max = parseInt(this.config.MAX_BACKUPS, 10);
            return isNaN(max) ? defaultMax : max;
        }
        return defaultMax;
    }
    /**
     * 是否压缩备份
     */
    getCompressBackups(defaultCompress = false) {
        if (this.config.COMPRESS_BACKUPS) {
            return this.config.COMPRESS_BACKUPS.toLowerCase() === "true";
        }
        return defaultCompress;
    }
    /**
     * 检查是否配置了 DeepSeek API
     */
    hasDeepSeekConfig() {
        return this.getDeepSeekApiKey().length > 0;
    }
}
/**
 * 全局配置管理器实例
 */
export const configManager = new ConfigManager();
/**
 * 从环境变量和参数创建配置管理器
 */
export function createConfigManager(params) {
    const manager = new ConfigManager();
    if (params) {
        manager.override(params);
    }
    return manager;
}
