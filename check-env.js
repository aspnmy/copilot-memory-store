import "dotenv/config";
import process from "node:process";

console.log("=== 环境变量检查 ===\n");

console.log("1. process.env.MEMORY_PATH:");
console.log(`   值: ${process.env.MEMORY_PATH}`);
console.log(`   类型: ${typeof process.env.MEMORY_PATH}`);
console.log(`   是否为空: ${!process.env.MEMORY_PATH}`);

console.log("\n2. 当前工作目录:");
console.log(`   ${process.cwd()}`);

console.log("\n3. .env 文件内容检查:");
import fs from "node:fs";
try {
  const envContent = fs.readFileSync(".env", "utf-8");
  const lines = envContent.split("\n").filter(line => line.includes("MEMORY_PATH"));
  console.log("   MEMORY_PATH 相关行:");
  lines.forEach(line => console.log(`   ${line}`));
} catch (err) {
  console.log("   无法读取 .env 文件");
}

console.log("\n4. 路径解析测试:");
import path from "node:path";
const raw = (process.env.MEMORY_PATH || ".copilot-memory.json").trim();
console.log(`   原始值: ${raw}`);
console.log(`   是否为绝对路径: ${path.isAbsolute(raw)}`);
const resolved = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
console.log(`   解析后路径: ${resolved}`);

console.log("\n=== 检查完成 ===");
