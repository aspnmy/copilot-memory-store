import "dotenv/config";
import { addMemory } from "./dist/memoryStore.js";
import process from "node:process";

console.log("=== 测试 addMemory 的路径解析 ===\n");

console.log("1. 检查环境变量:");
console.log(`   MEMORY_PATH = ${process.env.MEMORY_PATH}`);

console.log("\n2. 调用 addMemory (不传递 memoryPath):");
const mem = await addMemory({ 
  text: "测试记忆路径解析",
  tags: ["test"]
});
console.log(`   记忆已保存: ${mem.id}`);
console.log(`   创建时间: ${mem.createdAt}`);

console.log("\n3. 检查两个文件:");
import fs from "node:fs";
import path from "node:path";

// 检查默认路径
const defaultPath = ".copilot-memory.json";
if (fs.existsSync(defaultPath)) {
  const content = fs.readFileSync(defaultPath, "utf-8");
  const records = JSON.parse(content);
  console.log(`   ✓ ${defaultPath} 存在 (${records.length} 条记录)`);
} else {
  console.log(`   ✗ ${defaultPath} 不存在`);
}

// 检查配置路径
const configPath = process.env.MEMORY_PATH || "";
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, "utf-8");
  const records = JSON.parse(content);
  console.log(`   ✓ ${configPath} 存在 (${records.length} 条记录)`);
} else {
  console.log(`   ✗ ${configPath} 不存在`);
}

console.log("\n=== 测试完成 ===");
