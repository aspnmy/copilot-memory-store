@echo off
cd /d v:\git_data\copilot-memory-store

echo Searching for all active rules in global memory...
node dist/cli.js search "规则" --limit 50
