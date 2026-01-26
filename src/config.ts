import "dotenv/config";
import process from "node:process";

/**
 * 配置接口
 */
export interface Config {
  MEMORY_PATH?: string;
  MEMORY_LOCK_PATH?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  DEEPSEEK_MODEL?: string;
  BACKUP_INTERVAL?: string;
  BACKUP_FORMAT?: string;
  BACKUP_DIR?: string;
  MAX_BACKUPS?: string;
  COMPRESS_BACKUPS?: string;
}

/**
 * 配置管理类
 * 支持参数覆盖 .env 配置
 * 规则：配置参数中存在与 .env 中同名参数则配置参数为准，不存在同名参数则 .env
 */
export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadFromEnv();
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnv(): Config {
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
  public override(params: Partial<Config>): void {
    for (const key in params) {
      if (params[key as keyof Config] !== undefined) {
        this.config[key as keyof Config] = params[key as keyof Config];
      }
    }
  }

  /**
   * 获取配置值
   */
  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  /**
   * 获取所有配置
   */
  public getAll(): Config {
    return { ...this.config };
  }

  /**
   * 获取内存路径
   */
  public getMemoryPath(defaultPath: string = "project-memory.json"): string {
    return (this.config.MEMORY_PATH || defaultPath).trim();
  }

  /**
   * 获取内存锁路径
   */
  public getMemoryLockPath(): string | undefined {
    return this.config.MEMORY_LOCK_PATH?.trim();
  }

  /**
   * 获取 DeepSeek API 密钥
   */
  public getDeepSeekApiKey(): string {
    return (this.config.DEEPSEEK_API_KEY || "").trim();
  }

  /**
   * 获取 DeepSeek 基础 URL
   */
  public getDeepSeekBaseUrl(defaultUrl: string = "https://api.deepseek.com"): string {
    return (this.config.DEEPSEEK_BASE_URL || defaultUrl).trim();
  }

  /**
   * 获取 DeepSeek 模型
   */
  public getDeepSeekModel(defaultModel: string = "deepseek-chat"): string {
    return (this.config.DEEPSEEK_MODEL || defaultModel).trim();
  }

  /**
   * 获取备份间隔
   */
  public getBackupInterval(defaultInterval: number = 3600000): number {
    if (this.config.BACKUP_INTERVAL) {
      const interval = parseInt(this.config.BACKUP_INTERVAL, 10);
      return isNaN(interval) ? defaultInterval : interval;
    }
    return defaultInterval;
  }

  /**
   * 获取备份格式
   */
  public getBackupFormat(defaultFormat: string = "json"): string {
    return (this.config.BACKUP_FORMAT || defaultFormat).toLowerCase();
  }

  /**
   * 获取备份目录
   */
  public getBackupDir(defaultDir: string = "./backups"): string {
    return (this.config.BACKUP_DIR || defaultDir).trim();
  }

  /**
   * 获取最大备份数
   */
  public getMaxBackups(defaultMax: number = 10): number {
    if (this.config.MAX_BACKUPS) {
      const max = parseInt(this.config.MAX_BACKUPS, 10);
      return isNaN(max) ? defaultMax : max;
    }
    return defaultMax;
  }

  /**
   * 是否压缩备份
   */
  public getCompressBackups(defaultCompress: boolean = false): boolean {
    if (this.config.COMPRESS_BACKUPS) {
      return this.config.COMPRESS_BACKUPS.toLowerCase() === "true";
    }
    return defaultCompress;
  }

  /**
   * 检查是否配置了 DeepSeek API
   */
  public hasDeepSeekConfig(): boolean {
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
export function createConfigManager(params?: Partial<Config>): ConfigManager {
  const manager = new ConfigManager();
  if (params) {
    manager.override(params);
  }
  return manager;
}
