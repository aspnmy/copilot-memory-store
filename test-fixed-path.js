import "dotenv/config";
import { addMemory } from "./dist/memoryStore.js";
import fs from "node:fs";
import process from "node:process";

console.log("=== 测试修复后的记忆路径 ===\n");

console.log("1. 环境变量:");
console.log(`   MEMORY_PATH = ${process.env.MEMORY_PATH}`);

console.log("\n2. 添加新记忆:");
const mem = await addMemory({ 
  text: "测试修复后的路径 - 应该保存到配置的路径",
  tags: ["test", "fixed"]
});
console.log(`   记忆ID: ${mem.id}`);
console.log(`   创建时间: ${mem.createdAt}`);

console.log("\n3. 验证保存位置:");
const configPath = process.env.MEMORY_PATH || "";
if (fs.existsSync(configPath)) {
  const content = fs.readFileSync(configPath, "utf-8");
  const records = JSON.parse(content);
  const found = records.find(r => r.id === mem.id);
  if (found) {
    console.log(`   ✓ 记忆已保存到配置路径: ${configPath}`);
    console.log(`   ✓ 配置路径总记录数: ${records.length}`);
  } else {
    console.log(`   ✗ 记忆未在配置路径中找到`);
  }
} else {
  console.log(`   ✗ 配置路径不存在: ${configPath}`);
}

const defaultPath = ".copilot-memory.json";
if (fs.existsSync(defaultPath)) {
  const content = fs.readFileSync(defaultPath, "utf-8");
  const records = JSON.parse(content);
  const found = records.find(r => r.id === mem.id);
  if (found) {
    console.log(`   ✗ 记忆被错误保存到默认路径: ${defaultPath}`);
  } else {
    console.log(`   ✓ 记忆未保存到默认路径（正确）`);
  }
}

console.log("\n=== 测试完成 ===");
