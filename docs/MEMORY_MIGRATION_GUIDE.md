# 记忆移植指南

## 概述

Copilot Memory Store 提供了完整的记忆移植功能，可以将记忆导出为多种格式，以便在其他模型/工具中使用。

## 当前记忆存储架构

记忆记录包含完整的字段：

```typescript
type MemoryRecord = {
  id: string;        // 唯一标识符
  text: string;      // 记忆内容文本
  tags: string[];    // 用户提供的标签
  keywords: string[]; // 自动提取的关键词
  createdAt: string;  // 创建时间
  updatedAt: string;  // 修改时间
  deletedAt: string | null; // 删除时间
}
```

## 导出功能

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

### 导出文件示例

#### JSON 格式示例

```json
[
  {
    "id": "m_20260126T181231094Z_2bc088",
    "text": "测试功能",
    "tags": ["trae", "test"],
    "keywords": [],
    "createdAt": "2026-01-26T18:12:31.094Z",
    "updatedAt": "2026-01-26T18:12:31.094Z",
    "deletedAt": null
  }
]
```

#### Markdown 格式示例

```markdown
# 记忆导出

导出时间: 2026-01-26T18:21:21.542Z
总记忆数: 3

## m_20260126T181231094Z_2bc088
**标签**: trae, test
**关键词**: 
**创建时间**: 2026-01-26T18:12:31.094Z

测试功能
```

#### CSV 格式示例

```csv
id,text,tags,keywords,createdAt,updatedAt,deletedAt
"m_20260126T181231094Z_2bc088","测试功能","trae, test","",2026-01-26T18:12:31.094Z,2026-01-26T18:12:31.094Z,
```

#### 嵌入向量准备格式示例

```json
{"id":"m_20260126T181231094Z_2bc088","text":"测试功能","metadata":{"tags":["trae","test"],"keywords":[],"createdAt":"2026-01-26T18:12:31.094Z"}}
```

## 导入功能

### 导入命令

```bash
# 从默认文件导入
npm run memory:import

# 从指定文件导入
npx tsx src/import-memories.ts path/to/export-file.json
```

### 导入特性

- **自动去重**：跳过已存在的记忆 ID
- **错误处理**：记录导入失败的记忆
- **统计报告**：显示导入成功、跳过和失败的记录数

## 使用场景

### 场景 1：备份记忆

```bash
# 导出所有记忆为 JSON 格式
npm run memory:export
```

### 场景 2：在不同环境间迁移

```bash
# 在源环境中导出
npm run memory:export

# 将导出文件复制到目标环境
# 在目标环境中导入
npm run memory:import
```

### 场景 3：在其他 LLM 中使用

```bash
# 导出为嵌入向量准备格式
npm run memory:export:embedding

# 使用导出的文件进行 LLM 嵌入
# 例如：使用 OpenAI Embeddings API
```

### 场景 4：生成文档

```bash
# 导出为 Markdown 格式
npm run memory:export:md

# 将导出的 Markdown 文件添加到项目文档中
```

### 场景 5：数据分析

```bash
# 导出为 CSV 格式
npm run memory:export:csv

# 在 Excel 或其他数据分析工具中打开 CSV 文件
```

## 最佳实践

1. **定期备份**：定期导出记忆数据作为备份
2. **版本控制**：将导出的记忆文件添加到版本控制系统
3. **格式选择**：根据使用场景选择合适的导出格式
4. **数据验证**：导入后验证数据的完整性和准确性
5. **错误处理**：检查导入日志，确保所有记忆都被正确处理

## 注意事项

- 导出文件默认保存在项目根目录
- 导入时会自动跳过已存在的记忆 ID
- 确保有足够的磁盘空间来存储导出文件
- 对于大量记忆，导出可能需要一些时间

## 故障排除

### 导出失败

- 检查文件写入权限
- 确保磁盘空间充足
- 检查记忆文件是否损坏

### 导入失败

- 检查导入文件格式是否正确
- 验证 JSON 语法是否有效
- 检查文件路径是否正确

### 记忆丢失

- 检查是否导出了正确的记忆文件
- 验证导入路径是否正确
- 查看导入日志中的错误信息