import "dotenv/config";
import { addMemory } from "./memoryStore.js";
async function testTraeWrite() {
    try {
        console.log("测试 trae_write 功能...\n");
        // 测试 1: 简单记忆
        console.log("测试 1: 添加简单记忆");
        const result1 = await addMemory({
            text: "测试功能",
            tags: ["trae", "test"]
        });
        console.log("✓ 记忆已添加:", result1.id);
        console.log("  文本:", result1.text);
        console.log("  标签:", result1.tags);
        console.log("  关键词:", result1.keywords);
        console.log();
        // 测试 2: 带有 traeType 的记忆
        console.log("测试 2: 添加带有 traeType 的记忆");
        const result2 = await addMemory({
            text: "使用 TypeScript strict 模式",
            tags: ["trae", "preference"]
        });
        console.log("✓ 记忆已添加:", result2.id);
        console.log("  文本:", result2.text);
        console.log("  标签:", result2.tags);
        console.log("  关键词:", result2.keywords);
        console.log();
        // 测试 3: 带有多个标签的记忆
        console.log("测试 3: 添加带有多个标签的记忆");
        const result3 = await addMemory({
            text: "API 使用 REST 约定",
            tags: ["trae", "architecture", "api", "decision"]
        });
        console.log("✓ 记忆已添加:", result3.id);
        console.log("  文本:", result3.text);
        console.log("  标签:", result3.tags);
        console.log("  关键词:", result3.keywords);
        console.log();
        console.log("所有测试完成！");
    }
    catch (error) {
        console.error("错误:", error);
    }
}
testTraeWrite();
