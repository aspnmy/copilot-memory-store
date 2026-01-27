use gmem_rust_memory_store::{MemoryStore, run_repl};
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    
    let memory_path = if args.len() > 1 {
        Some(args[1].as_str())
    } else {
        None
    };

    let store = MemoryStore::new(memory_path);

    if let Err(e) = run_repl(store) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
