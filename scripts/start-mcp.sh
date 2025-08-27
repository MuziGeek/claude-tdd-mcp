#!/bin/bash

# TDD脚手架MCP服务启动脚本
# 用于手动启动MCP服务器进行测试

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 启动TDD脚手架MCP服务..."
echo "项目路径: $PROJECT_ROOT"
echo "服务路径: $PROJECT_ROOT/mcp-server/index.js"
echo ""

cd "$PROJECT_ROOT"

# 检查Node.js版本
NODE_VERSION=$(node --version)
echo "Node.js版本: $NODE_VERSION"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "⚠️  未找到node_modules，正在安装依赖..."
    npm install
fi

# 启动MCP服务器
echo ""
echo "🌐 启动MCP服务器..."
echo "使用 Ctrl+C 停止服务"
echo ""

export TDD_CACHE_DIR="$HOME/.cache/tdd-scaffold"
export NODE_ENV=development

node mcp-server/index.js