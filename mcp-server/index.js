#!/usr/bin/env node

/**
 * TDD Scaffold MCP Server
 * 为Claude Code提供完整的TDD开发流程支持
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { SessionManager } from './state/session-manager.js';
import { LogLevel, createLogger } from './utils/logger.js';

// 创建日志器
const logger = createLogger('TDD-Scaffold-MCP', LogLevel.INFO);

/**
 * TDD脚手架MCP服务器
 */
class TDDScaffoldMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tdd-scaffold',
        version: '2.0.0',
        description: 'Test-Driven Development scaffold for Claude Code'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );
    
    this.sessionManager = new SessionManager();
    this.initialized = false;
  }

  /**
   * 初始化服务器
   */
  async initialize() {
    try {
      logger.info('🚀 初始化TDD脚手架MCP服务器...');
      
      // 注册工具
      await registerTools(this.server, this.sessionManager);
      logger.info('✅ 工具注册完成');
      
      // 注册资源
      await registerResources(this.server, this.sessionManager);
      logger.info('✅ 资源注册完成');
      
      // 设置错误处理
      this.setupErrorHandlers();
      
      this.initialized = true;
      logger.info('🎉 TDD脚手架MCP服务器初始化完成');
      
    } catch (error) {
      logger.error('❌ 服务器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置错误处理器
   */
  setupErrorHandlers() {
    this.server.onerror = (error) => {
      logger.error('MCP服务器错误:', error);
    };

    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      process.exit(1);
    });

    process.on('SIGINT', () => {
      logger.info('收到SIGINT信号，正在关闭服务器...');
      this.shutdown();
    });
  }

  /**
   * 启动服务器
   */
  async start() {
    if (!this.initialized) {
      await this.initialize();
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('📡 TDD脚手架MCP服务器已启动，等待客户端连接...');
  }

  /**
   * 关闭服务器
   */
  async shutdown() {
    logger.info('🛑 关闭TDD脚手架MCP服务器...');
    
    // 保存会话状态
    await this.sessionManager.saveAllSessions();
    
    // 关闭服务器
    await this.server.close();
    
    logger.info('✅ 服务器已安全关闭');
    process.exit(0);
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      activeSessions: this.sessionManager.getActiveSessionCount(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}

// 创建并启动服务器实例
const server = new TDDScaffoldMCPServer();

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  server.start().catch(error => {
    console.error('启动服务器失败:', error);
    process.exit(1);
  });
}

export default server;
export { TDDScaffoldMCPServer };