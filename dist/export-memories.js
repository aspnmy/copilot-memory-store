import "dotenv/config";
import { loadStore, exportJson } from "./memoryStore.js";
import fs from "node:fs";
import path from "node:path";
async function exportMemories() {
    try {
        console.log("导出记忆数据...\n");
        // 加载记忆存储
        const { records } = loadStore();
        // 导出为 JSON 格式
        const jsonData = exportJson(records);
        // 保存到文件
        const exportPath = path.join(process.cwd(), "memories-export.json");
        fs.writeFileSync(exportPath, jsonData, "utf-8");
        console.log(`✓ 记忆已导出到: ${exportPath}`);
        console.log(`✓ 总共导出 ${records.length} 条记忆`);
        console.log(`✓ 文件大小: ${jsonData.length} 字节`);
    }
    catch (error) {
        console.error("导出失败:", error);
    }
}
exportMemories();
