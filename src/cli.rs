use std::collections::HashMap;
use std::io::{self, Write};
use regex::Regex;
use crate::store::MemoryStore;
use crate::compress::compress_deterministic;

/// 解析的命令结构
#[derive(Debug)]
pub struct Parsed {
    pub cmd: String,
    pub args: Vec<String>,
    pub opts: HashMap<String, String>,
}

/// 解析命令行字符串
///
/// # 参数
/// * `line` - 命令行字符串
///
/// # 返回
/// 解析后的命令结构，如果输入为空则返回 None
pub fn parse(line: &str) -> Option<Parsed> {
    let tokens = tokenize(line.trim());
    if tokens.is_empty() {
        return None;
    }

    let cmd = tokens[0].to_lowercase();
    let mut opts: HashMap<String, String> = HashMap::new();
    let mut args: Vec<String> = Vec::new();

    let mut i = 1;
    while i < tokens.len() {
        let t = &tokens[i];
        if let Some(key) = t.strip_prefix("--") {
            if i + 1 < tokens.len() && !tokens[i + 1].starts_with("--") {
                opts.insert(key.to_string(), tokens[i + 1].clone());
                i += 2;
            } else {
                opts.insert(key.to_string(), String::new());
                i += 1;
            }
        } else {
            args.push(t.clone());
            i += 1;
        }
    }

    Some(Parsed { cmd, args, opts })
}

/// 分词命令行字符串，处理带引号的字符串
///
/// # 参数
/// * `line` - 命令行字符串
///
/// # 返回
/// 分词后的字符串数组
fn tokenize(line: &str) -> Vec<String> {
    let re = Regex::new(r#""([^"\\]*(?:\\.[^"\\]*)*"|'([^'\\]*(?:\\.[^'\\]*)*)'|(\S+))"#).unwrap();
    re.find_iter(line)
        .map(|m| {
            let token = m.as_str();
            token.replace(r#"\""#, "\"").replace(r#"\'"#, "'")
        })
        .collect()
}

/// 主命令行 REPL 循环
///
/// # 参数
/// * `store` - 记忆存储实例
///
/// # 返回
/// IO 错误（如果有）
pub fn run_repl(store: MemoryStore) -> io::Result<()> {
    let stdin = io::stdin();
    let mut stdout = io::stdout();

    println!("Copilot Memory Store CLI");
    println!("Type 'help' for available commands, 'exit' to quit\n");

    loop {
        print!("> ");
        stdout.flush()?;

        let mut line = String::new();
        stdin.read_line(&mut line)?;

        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if line == "exit" {
            println!("Goodbye!");
            break;
        }

        match parse(line) {
            Some(parsed) => {
                if let Err(e) = execute_command(&store, &parsed) {
                    println!("Error: {}", e);
                }
            }
            None => continue,
        }
    }

    Ok(())
}

/// 执行命令
///
/// # 参数
/// * `store` - 记忆存储实例
/// * `parsed` - 解析后的命令
///
/// # 返回
/// IO 错误（如果有）
fn execute_command(store: &MemoryStore, parsed: &Parsed) -> io::Result<()> {
    match parsed.cmd.as_str() {
        "add" => {
            let text = parsed.args.join(" ");
            let tags = parsed.opts.get("tags")
                .map(|t| t.split(',').map(|s| s.trim().to_string()).collect());

            let rec = store.add_memory(&text, tags)?;
            println!("✅ Added {}", rec.id);
        }
        "search" => {
            let query = parsed.args.join(" ");
            let limit = parsed.opts.get("limit")
                .and_then(|l| l.parse().ok());

            let hits = store.search(&query, limit)?;
            if hits.is_empty() {
                println!("No results found");
            } else {
                for (i, hit) in hits.iter().enumerate() {
                    let tag_str = if hit.tags.is_empty() {
                        String::new()
                    } else {
                        format!(" [{}]", hit.tags.join(", "))
                    };
                    println!("{}. {}{} (score: {:.1})", i + 1, hit.text, tag_str, hit.score);
                }
            }
        }
        "stats" => {
            let stats = store.compute_stats()?;
            println!("Total: {}, Active: {}, Deleted: {}", stats.total, stats.active, stats.deleted);
            if !stats.tags.is_empty() {
                println!("\nTags:");
                for (tag, count) in stats.tags.iter().take(10) {
                    println!("  - {}: {}", tag, count);
                }
            }
        }
        "delete" => {
            if parsed.args.is_empty() {
                println!("Usage: delete <id>");
                return Ok(());
            }
            let id = &parsed.args[0];
            if store.soft_delete(id)? {
                println!("✅ Deleted {}", id);
            } else {
                println!("❌ Memory not found: {}", id);
            }
        }
        "purge" => {
            let id = parsed.opts.get("id").map(|s| s.as_str());
            let tag = parsed.opts.get("tag").map(|s| s.as_str());
            let match_text = parsed.opts.get("text").map(|s| s.as_str());
            
            let purged = store.purge(id, tag, match_text)?;
            println!("✅ Purged {} memories", purged);
        }
        "compress" => {
            let query = parsed.args.join(" ");
            let budget = parsed.opts.get("budget")
                .and_then(|b| b.parse().ok())
                .unwrap_or(2000);
            let limit = parsed.opts.get("limit")
                .and_then(|l| l.parse().ok());

            let records = store.load()?;
            let result = compress_deterministic(&records, &query, budget, limit);
            
            println!("--- Compressed Output ({} / {} chars) ---", result.used, result.budget);
            println!("{}", result.markdown);
            println!("--- End ---");
        }
        "export" => {
            let json = store.export_json()?;
            println!("{}", json);
        }
        "import" => {
            if parsed.args.is_empty() {
                println!("Usage: import <json_file>");
                return Ok(());
            }
            let file_path = &parsed.args[0];
            let json_data = std::fs::read_to_string(file_path)?;
            let (success, skipped, failed) = store.import_json(&json_data)?;
            println!("✅ Imported: {}, Skipped: {}, Failed: {}", success, skipped, failed);
        }
        "help" => {
            println!("Available commands:");
            println!("  add [--tags a,b,c] <text>      - Store a new memory");
            println!("  search <query> [--limit N]     - Search memories");
            println!("  delete <id>                    - Soft delete a memory");
            println!("  purge [--id ID] [--tag TAG] [--text TEXT] - Hard delete memories");
            println!("  compress <query> [--budget N] [--limit N] - Compress memories");
            println!("  stats                          - Show memory statistics");
            println!("  export                         - Export all memories as JSON");
            println!("  import <json_file>             - Import memories from JSON file");
            println!("  help                           - Show this help");
            println!("  exit                           - Quit CLI");
        }
        _ => {
            println!("Unknown command: {}. Type 'help' for available commands.", parsed.cmd);
        }
    }
    Ok(())
}
