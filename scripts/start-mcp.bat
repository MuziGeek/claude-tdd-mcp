@echo off
REM TDD脚手架MCP服务启动脚本（Windows版本）
REM 用于手动启动MCP服务器进行测试

setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

echo 🚀 启动TDD脚手架MCP服务...
echo 项目路径: %PROJECT_ROOT%
echo 服务路径: %PROJECT_ROOT%\mcp-server\index.js
echo.

cd /d "%PROJECT_ROOT%"

REM 检查Node.js版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js版本: %NODE_VERSION%

REM 检查依赖
if not exist "node_modules" (
    echo ⚠️  未找到node_modules，正在安装依赖...
    npm install
)

REM 启动MCP服务器
echo.
echo 🌐 启动MCP服务器...
echo 使用 Ctrl+C 停止服务
echo.

set TDD_CACHE_DIR=%USERPROFILE%\.cache\tdd-scaffold
set NODE_ENV=development

node mcp-server\index.js

pause