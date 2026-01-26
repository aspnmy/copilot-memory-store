# Gmem 记忆系统使用指南

本指南说明如何在任意 AI 聊天窗口中使用 Gmem 记忆系统来持久化保存和检索信息。

## 快速开始

Gmem 记忆系统是一个持久化记忆存储，可以帮助 AI 助手记住重要信息、偏好设置、决策和上下文。

### 基本概念

- **新增记忆**：保存重要信息到记忆库
- **查询记忆**：搜索已保存的记忆
- **记忆列表**：查看所有已保存的记忆
- **记忆注入**：将相关记忆注入到当前对话上下文中

## 使用方式

### 1. 新增记忆

在 AI 聊天窗口中输入：

```
新增记忆：[要保存的内容]
```

或使用标签：

```
新增记忆：[要保存的内容] --tags gmem,preference,development
```

**示例**：
```
新增记忆：所有的开发项目，使用时区都以shanghai为准
新增记忆：使用 TypeScript 严格模式 --tags gmem,preference
```

### 2. 查询记忆

在 AI 聊天窗口中输入：

```
查询记忆：[搜索关键词]
```

**示例**：
```
查询记忆：时区
查询记忆：TypeScript
```

### 3. 记忆列表

在 AI 聊天窗口中输入：

```
记忆列表
```

这会显示所有已保存的记忆，包括：
- 记忆 ID
- 记忆内容
- 标签
- 创建时间

### 4. 记忆注入

在 AI 聊天窗口中输入：

```
记忆注入：[查询关键词]
```

或

```
注入记忆：[查询关键词]
```

这会将相关记忆注入到当前对话的上下文中，帮助 AI 更好地理解你的需求和偏好。

**示例**：
```
记忆注入：开发项目
注入记忆：命令行
```

## 标签系统

使用标签来组织和分类记忆：

- `gmem`：Gmem 记忆系统的默认标签
- `preference`：偏好设置
- `decision`：决策记录
- `fact`：事实信息
- `architecture`：架构设计
- `development`：开发相关
- `timezone`：时区设置

**示例**：
```
新增记忆：API 使用 REST 规范 --tags gmem,architecture,api
新增记忆：使用 ESLint 进行代码检查 --tags gmem,preference,development
```

## 最佳实践

### 1. 保存重要决策

```
新增记忆：项目采用微服务架构，每个服务独立部署 --tags gmem,decision,architecture
```

### 2. 记录偏好设置

```
新增记忆：代码风格使用 2 空格缩进，不使用分号 --tags gmem,preference
```

### 3. 保存技术规范

```
新增记忆：所有 API 端点必须包含版本号 /api/v1/ --tags gmem,architecture,api
```

### 4. 记录项目约定

```
新增记忆：所有开发项目，使用时区都以shanghai为准 --tags gmem,preference,timezone,development
```

## 命令行使用

如果你有命令行访问权限，也可以直接使用 CLI：

```bash
# 新增记忆
node dist/cli.js add --tags gmem,preference "要保存的内容"

# 查询记忆
node dist/cli.js search "搜索关键词"

# 查看统计
node dist/cli.js stats

# 导出所有记忆
node dist/cli.js export

# 注入记忆到上下文
node dist/cli.js compress --query "关键词" --limit 5
```

## 记忆持久化

- 所有记忆都保存在配置的路径中
- 使用上海时区（UTC+8）记录时间戳
- 记忆可以跨会话、跨 AI 助手共享
- 支持导入导出功能

## 注意事项

1. **明确性**：记忆内容要清晰明确，便于后续搜索
2. **标签使用**：合理使用标签可以提高检索效率
3. **定期维护**：定期查看记忆列表，删除过时的记忆
4. **上下文注入**：在需要时使用记忆注入功能，让 AI 了解你的偏好

## 常见场景

### 场景 1：项目开发

```
新增记忆：项目使用 TypeScript + React 技术栈 --tags gmem,architecture,development
新增记忆：所有组件必须使用函数式组件 --tags gmem,preference,react
```

### 场景 2：API 设计

```
新增记忆：API 返回格式统一使用 JSON --tags gmem,preference,api
新增记忆：所有 API 请求必须包含认证头 --tags gmem,architecture,security
```

### 场景 3：代码规范

```
新增记忆：使用 ESLint + Prettier 进行代码格式化 --tags gmem,preference,development
新增记忆：函数命名使用驼峰命名法 --tags gmem,preference,coding
```

### 场景 4：团队协作

```
新增记忆：代码审查需要至少 2 人批准 --tags gmem,process,team
新增记忆：每周五下午进行技术分享 --tags gmem,process,team
```

## 高级功能

### 1. 批量导入

如果有大量记忆需要导入，可以创建 JSON 文件并使用导入功能。

### 2. 记忆压缩

当记忆数量较多时，可以使用压缩功能将相关记忆合并。

### 3. 自动备份

系统支持自动备份功能，定期备份记忆数据。

## 故障排除

### 问题：记忆未保存

- 检查配置路径是否正确
- 确认有写入权限
- 查看错误日志

### 问题：搜索不到记忆

- 确认记忆已成功保存
- 尝试使用不同的关键词
- 检查标签是否正确

### 问题：记忆注入失败

- 确认查询关键词正确
- 检查记忆是否存在
- 尝试增加 limit 参数

## 总结

Gmem 记忆系统是一个强大的工具，可以帮助 AI 助手更好地理解你的需求和偏好。通过合理使用新增记忆、查询记忆、记忆列表和记忆注入功能，你可以：

- 持久化保存重要信息
- 快速检索历史记忆
- 注入上下文提高 AI 理解能力
- 跨会话共享记忆

开始使用 Gmem 记忆系统，让 AI 助手成为你的得力助手！
