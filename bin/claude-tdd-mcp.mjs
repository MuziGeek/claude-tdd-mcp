#!/usr/bin/env node

/**
 * Claude TDD MCP 服务器启动包装器
 * 解决 ES modules 与 npx 兼容性问题
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件所在目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 动态导入主服务器模块
const serverPath = join(__dirname, '../mcp-server/index.js');

try {
  const { default: server } = await import(serverPath);
  
  // 启动服务器
  await server.start();
} catch (error) {
  console.error('Failed to start claude-tdd-mcp server:', error);
  process.exit(1);
}