import "dotenv/config";
import { loadStore, addMemory } from "./memoryStore.js";
import fs from "node:fs";

async function importMemories(importPath: string) {
  try {
    console.log(`从 ${importPath} 导入记忆...\n`);
    
    // 读取导入文件
    const jsonData = fs.readFileSync(importPath, "utf-8");
    const importedRecords = JSON.parse(jsonData);
    
    console.log(`找到 ${importedRecords.length} 条记忆\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // 加载当前记忆存储
    const { records: existingRecords } = loadStore();
    const existingIds = new Set(existingRecords.map(r => r.id));
    
    // 导入每条记忆
    for (const record of importedRecords) {
      try {
        // 检查是否已存在
        if (existingIds.has(record.id)) {
          console.log(`⊘ 跳过已存在的记忆: ${record.id}`);
          skipCount++;
          continue;
        }
        
        // 添加记忆
        await addMemory({
          text: record.text,
          tags: record.tags
        });
        
        console.log(`✓ 导入记忆: ${record.id}`);
        successCount++;
        
      } catch (error) {
        console.error(`✗ 导入失败: ${record.id}`, error);
        errorCount++;
      }
    }
    
    console.log(`\n导入完成:`);
    console.log(`✓ 成功: ${successCount} 条`);
    console.log(`⊘ 跳过: ${skipCount} 条`);
    console.log(`✗ 失败: ${errorCount} 条`);
    
  } catch (error) {
    console.error("导入失败:", error);
  }
}

// 从命令行参数获取导入文件路径
const importPath = process.argv[2] || "memories-export.json";
importMemories(importPath);