# 🛠️ copilot-memory-store - 轻松管理上下文的简单方法

[![下载](https://img.shields.io/badge/下载-v1.0-blue.svg)](https://github.com/Tokio17/copilot-memory-store/releases)

## 📚 语言版本

- [English](README.md) - English version
- [中文](README-zh.md) - 本文档

## 🚀 开始使用

欢迎使用 copilot-memory-store！这个应用程序可以帮助你在使用 GitHub Copilot 等 AI 工具时管理上下文。它使用本地 JSON 文件提供简单的记忆存储。你可以通过命令行界面 (CLI) 或 MCP 服务器与这个存储进行交互，还有一个用于 Visual Studio Code 的自定义代理。

## 📦 下载与安装

### 方法一：从发布页面下载

要开始使用，请**访问此页面下载**软件的最新版本：[下载 copilot-memory-store](https://github.com/aspnmy/copilot-memory-store/releases)。

#### 安装步骤

1. 点击上面的链接打开发布页面。
2. 找到列出的最新版本。
3. 下载适合你的操作系统的文件。

### 方法二：从源码安装

如果你想从源码安装并包含 trae MCP 服务，请按照以下步骤操作：

#### 安装步骤

1. **克隆仓库：**
   ```bash
   git clone https://github.com/aspnmy/copilot-memory-store.git
   cd copilot-memory-store
   ```

2. **安装依赖：**
   ```bash
   npm install
   ```

3. **构建项目：**
   ```bash
   npm run build
   ```

4. **创建批处理文件（Windows）：**
   ```bash
   npm run create:bat
   npm run create:bat:trae
   ```

5. **运行 trae MCP 服务：**
   ```bash
   npm run trae
   ```

### 安装 NASM 汇编器（用于 gcc 编译）

如果你计划使用 gcc 编译项目为 exe 文件，需要安装 NASM 汇编器：

1. 从 [NASM 官网](https://www.nasm.us/) 下载 NASM 2.16.03 版本
2. 安装 NASM 并将其添加到系统 PATH 环境变量中
3. 确保 gcc 编译器也已安装并添加到 PATH 中

### 编译为 exe 文件（使用 gcc）

```bash
# 编译所有组件（包括 trae MCP 服务）
npm run pkg:all:gcc
```

### Trae MCP 服务配置文件

当你在 trae 中安装和使用 MCP 服务时，需要创建一个配置文件来定义 MCP 服务器。配置文件格式如下：

#### 配置文件格式

```json
{
  "mcpServers": {
    "trae-memory-store": {
      "command": "npm",
      "args": [
        "run",
        "trae"
      ]
    }
  }
}
```

#### 配置文件位置

- 对于 Windows 用户：配置文件通常位于 `%APPDATA%\trae\config\mcp.json`
- 对于 macOS/Linux 用户：配置文件通常位于 `~/.config/trae/config/mcp.json`

#### 配置说明

- `mcpServers`：包含所有 MCP 服务器配置的对象
- `trae-memory-store`：服务器名称，可以自定义
- `command`：启动 MCP 服务的命令，这里使用 `npm`
- `args`：命令参数，这里使用 `["run", "trae"]` 来运行 trae MCP 服务

#### 替代配置（使用批处理文件）

如果你使用批处理文件，可以这样配置：

```json
{
  "mcpServers": {
    "trae-memory-store": {
      "command": "bin\\copilot-memory-trae.bat",
      "args": []
    }
  }
}
```

#### 替代配置（使用编译后的 exe 文件）

如果你使用编译后的 exe 文件，可以这样配置：

```json
{
  "mcpServers": {
    "trae-memory-store": {
      "command": "bin\\copilot-memory-trae.exe",
      "args": []
    }
  }
}
```

## 📋 系统要求

在安装 copilot-memory-store 之前，请确保你的系统满足以下要求：

- **操作系统：**
  - Windows 10 或更高版本
  - macOS 10.13 或更高版本
  - Linux (基于 Debian)
- **内存：**
  - 至少 4GB RAM
- **磁盘空间：**
  - 至少 100MB 的可用空间

## 🛠️ 功能

- **本地 JSON 存储：** 保持数据有组织且本地存储。
- **命令行界面 (CLI)：** 与记忆存储交互的直接方法。
- **MCP 服务器：** 设置服务器以获得更高级的功能。
- **Trae MCP 服务器：** 为 Trae 提供专用的 MCP 服务，支持 Trae 特定的记忆管理和上下文压缩。
- **VS Code 集成：** 使用我们的自定义代理在编码时轻松管理上下文。

## ⚙️ 如何使用

安装 copilot-memory-store 后，请按照以下步骤开始使用：

1. **打开 CLI：** 在 Windows 上，按 `Win + R`，键入 `cmd`，然后按 Enter。在 macOS 上，打开“终端”。Linux 用户可以打开他们的终端应用程序。
  
2. **启动服务器：**
   - **标准 MCP 服务器：** 键入 `copilot-memory-mcp` 并按 Enter。
   - **Trae MCP 服务器：** 键入 `copilot-memory-trae` 并按 Enter。
   - 服务器将启动，你将看到一条消息指示它正在运行。

3. **使用 CLI：**
   - 键入 `copilot-memory-store help` 查看可用命令。
   - 使用 `add` 存储新条目，`get` 检索它们，`delete` 删除任何不需要的条目。

4. **访问 MCP 服务器：**
   - 打开你的 Web 浏览器并转到 `http://localhost:YOUR_PORT`（将 YOUR_PORT 替换为你启动服务器时显示的端口号）。

5. **使用 VS Code 代理：**
   - 从同一发布页面安装代理。
   - 按照 Visual Studio Code 中的安装提示操作。

6. **使用 Trae MCP 服务：**
   - **开发模式：** 运行 `npm run trae`
   - **构建模式：** 运行 `npm run trae:dist`
   - **批处理文件：** 使用 `bin/copilot-memory-trae.bat`
   
   **Trae 专用工具：**
   - `trae_write`：添加带有 Trae 特定元数据的记忆
   - `trae_search`：搜索 Trae 相关的记忆
   - `trae_compress`：为 Trae 任务压缩上下文
   - `trae_inject_context`：自动为 Trae 任务注入相关上下文
   
   **Trae 专用资源：**
   - `trae://stats`：Trae 记忆的统计信息
   - `trae://recent`：最近的 Trae 记忆

## 📖 文档

有关命令和功能的详细文档，请查看 [Wiki](https://github.com/Tokio17/copilot-memory-store/wiki)。此资源包括示例和高级提示，以增强你的体验。

## 🔄 记忆移植功能

Copilot Memory Store 提供了完整的记忆移植功能，可以将记忆导出为多种格式，以便在其他模型/工具中使用。

### 支持的导出格式

1. **JSON 格式** - 完整的数据结构，适合程序处理
2. **Markdown 格式** - 人类可读的文档格式
3. **CSV 格式** - 表格数据，适合 Excel 等工具
4. **纯文本格式** - 简单的文本格式
5. **嵌入向量准备格式** - 用于 LLM 嵌入和语义搜索

### 导出命令

```bash
# 导出为 JSON 格式（默认）
npm run memory:export

# 导出为 Markdown 格式
npm run memory:export:md

# 导出为 CSV 格式
npm run memory:export:csv

# 导出为纯文本格式
npm run memory:export:text

# 导出为嵌入向量准备格式
npm run memory:export:embedding
```

### 导入命令

```bash
# 从默认文件导入
npm run memory:import

# 从指定文件导入
npx tsx src/import-memories.ts path/to/export-file.json
```

### 使用场景

#### 场景 1：备份记忆
```bash
# 导出所有记忆为 JSON 格式
npm run memory:export
```

#### 场景 2：在不同环境间迁移
```bash
# 在源环境中导出
npm run memory:export

# 将导出文件复制到目标环境
# 在目标环境中导入
npm run memory:import
```

#### 场景 3：在其他 LLM 中使用
```bash
# 导出为嵌入向量准备格式
npm run memory:export:embedding

# 使用导出的文件进行 LLM 嵌入
# 例如：使用 OpenAI Embeddings API
```

#### 场景 4：生成文档
```bash
# 导出为 Markdown 格式
npm run memory:export:md

# 将导出的 Markdown 文件添加到项目文档中
```

#### 场景 5：数据分析
```bash
# 导出为 CSV 格式
npm run memory:export:csv

# 在 Excel 或其他数据分析工具中打开 CSV 文件
```

### 最佳实践

1. **定期备份**：定期导出记忆数据作为备份
2. **版本控制**：将导出的记忆文件添加到版本控制系统
3. **格式选择**：根据使用场景选择合适的导出格式
4. **数据验证**：导入后验证数据的完整性和准确性
5. **错误处理**：检查导入日志，确保所有记忆都被正确处理

### 自动备份功能

Copilot Memory Store 提供了自动备份功能，可以定期自动备份记忆数据。

#### 配置自动备份

在 `.env` 文件中添加以下配置：

```env
# 备份间隔（毫秒），默认 3600000（1小时）
BACKUP_INTERVAL=3600000

# 备份格式，支持：json, markdown, csv, plain_text, embedding_ready，默认 json
BACKUP_FORMAT=json

# 备份目录，默认 ./backups
BACKUP_DIR=./backups

# 最大备份数，默认 10
MAX_BACKUPS=10

# 是否压缩备份文件，默认 false
COMPRESS_BACKUPS=false
```

#### 自动备份命令

```bash
# 启动自动备份服务（持续运行，定期备份）
npm run backup:auto

# 执行一次性备份
npm run backup:once
```

#### 自动备份特性

- **定时备份**：按照配置的间隔自动备份记忆数据
- **多格式支持**：支持 JSON、Markdown、CSV、纯文本和嵌入向量准备格式
- **自动清理**：自动删除超过最大备份数的旧备份文件
- **优雅停止**：支持 Ctrl+C 优雅停止备份服务
- **详细日志**：提供详细的备份操作日志

#### 使用场景

**场景 1：开发环境自动备份**
```bash
# 在开发环境中启动自动备份服务
npm run backup:auto
```

**场景 2：生产环境定时备份**
```bash
# 使用 cron 或 Windows 任务计划程序定期执行一次性备份
npm run backup:once
```

**场景 3：重要操作前备份**
```bash
# 在执行重要操作前手动执行备份
npm run backup:once
```

### 详细文档

有关记忆移植功能的详细文档，请查看 [记忆移植指南](docs/MEMORY_MIGRATION_GUIDE.md)。

## 🤝 社区与支持

加入我们的社区，提出问题，分享见解，了解更多关于上下文工程的信息。你可以通过以下渠道联系我们：

- **GitHub Issues：** 报告任何问题或寻求帮助。
- **讨论板：** 分享想法并从其他用户那里获得反馈。

## 🔄 贡献

如果你有兴趣改进 copilot-memory-store，请考虑贡献！以下是你可以提供帮助的一些方式：

- 报告你发现的问题。
- 建议你希望看到的功能。
- 贡献代码、文档或翻译。

## 🌟 致谢

我们感谢所有使 copilot-memory-store 成为可能的人。你的支持和反馈是无价的。我们可以一起创新和改进上下文工程工具。

---

现在，请**访问此页面下载** copilot-memory-store：[下载 copilot-memory-store](https://github.com/Tokio17/copilot-memory-store/releases)。享受轻松管理你的 AI 上下文！