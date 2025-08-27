#!/usr/bin/env node

/**
 * TDD脚手架MCP服务安装脚本
 * 自动配置Claude Desktop以使用TDD脚手架MCP服务
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPInstaller {
  constructor() {
    this.scaffoldPath = path.resolve(__dirname, '..');
    this.mcpServerPath = path.join(this.scaffoldPath, 'mcp-server/index.js');
  }

  /**
   * 主安装流程
   */
  async install() {
    console.log('🚀 TDD脚手架MCP服务安装程序');
    console.log('=====================================\n');

    try {
      // 检查环境
      await this.checkEnvironment();
      
      // 获取Claude配置路径
      const configPath = await this.getClaudeConfigPath();
      
      // 读取现有配置
      const config = await this.readClaudeConfig(configPath);
      
      // 配置MCP服务
      const updatedConfig = await this.configureMCPServer(config);
      
      // 确认安装
      const confirmed = await this.confirmInstall(updatedConfig);
      if (!confirmed) {
        console.log('❌ 安装已取消');
        process.exit(0);
      }
      
      // 备份现有配置
      await this.backupConfig(configPath);
      
      // 写入新配置
      await this.writeClaudeConfig(configPath, updatedConfig);
      
      // 创建启动脚本
      await this.createStartupScript();
      
      // 安装完成
      this.showCompletionMessage();
      
    } catch (error) {
      console.error('❌ 安装失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 检查安装环境
   */
  async checkEnvironment() {
    console.log('🔍 检查安装环境...');
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`需要Node.js 16+，当前版本: ${nodeVersion}`);
    }
    
    // 检查MCP服务器文件
    if (!await fs.pathExists(this.mcpServerPath)) {
      throw new Error(`MCP服务器文件不存在: ${this.mcpServerPath}`);
    }
    
    console.log('✅ 环境检查通过');
    console.log(`   Node.js版本: ${nodeVersion}`);
    console.log(`   脚手架路径: ${this.scaffoldPath}`);
  }

  /**
   * 获取Claude配置文件路径
   */
  async getClaudeConfigPath() {
    const platform = os.platform();
    let defaultPath;
    
    switch (platform) {
      case 'win32':
        defaultPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
        break;
      case 'darwin':
        defaultPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        break;
      case 'linux':
        defaultPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
        break;
      default:
        defaultPath = path.join(os.homedir(), '.claude_desktop_config.json');
    }
    
    console.log(`\n📁 Claude配置文件路径:`);
    console.log(`   默认路径: ${defaultPath}`);
    
    const { configPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'configPath',
        message: '请确认Claude配置文件路径:',
        default: defaultPath
      }
    ]);
    
    return path.resolve(configPath);
  }

  /**
   * 读取Claude配置
   */
  async readClaudeConfig(configPath) {
    console.log('\n📖 读取Claude配置...');
    
    let config = { mcpServers: {} };
    
    if (await fs.pathExists(configPath)) {
      try {
        config = await fs.readJson(configPath);
        if (!config.mcpServers) {
          config.mcpServers = {};
        }
        console.log(`✅ 已读取现有配置文件`);
      } catch (error) {
        console.log(`⚠️  配置文件格式错误，将创建新配置`);
        config = { mcpServers: {} };
      }
    } else {
      console.log(`📝 配置文件不存在，将创建新文件`);
      await fs.ensureDir(path.dirname(configPath));
    }
    
    return config;
  }

  /**
   * 配置MCP服务器
   */
  async configureMCPServer(config) {
    console.log('\n⚙️  配置TDD脚手架MCP服务...');
    
    const serverName = 'tdd-scaffold';
    
    // 检查是否已存在配置
    if (config.mcpServers[serverName]) {
      console.log(`⚠️  发现现有的${serverName}配置`);
      
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: '是否覆盖现有配置?',
          default: true
        }
      ]);
      
      if (!overwrite) {
        console.log('❌ 安装已取消');
        process.exit(0);
      }
    }
    
    // 配置缓存目录
    const cacheDir = path.join(os.homedir(), '.cache', 'tdd-scaffold');
    await fs.ensureDir(cacheDir);
    
    // MCP服务器配置
    config.mcpServers[serverName] = {
      command: 'node',
      args: [this.mcpServerPath],
      env: {
        TDD_CACHE_DIR: cacheDir,
        NODE_ENV: 'production'
      }
    };
    
    console.log('✅ MCP服务器配置完成');
    console.log(`   服务名称: ${serverName}`);
    console.log(`   脚本路径: ${this.mcpServerPath}`);
    console.log(`   缓存目录: ${cacheDir}`);
    
    return config;
  }

  /**
   * 确认安装
   */
  async confirmInstall(config) {
    console.log('\n📋 安装配置预览:');
    console.log('================');
    
    Object.entries(config.mcpServers).forEach(([name, server]) => {
      console.log(`服务: ${name}`);
      console.log(`  命令: ${server.command} ${server.args.join(' ')}`);
      console.log(`  环境变量: ${JSON.stringify(server.env, null, 2)}`);
    });
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '\n是否继续安装?',
        default: true
      }
    ]);
    
    return confirm;
  }

  /**
   * 备份配置文件
   */
  async backupConfig(configPath) {
    if (await fs.pathExists(configPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${configPath}.backup-${timestamp}`;
      
      await fs.copy(configPath, backupPath);
      console.log(`💾 已备份配置文件: ${backupPath}`);
    }
  }

  /**
   * 写入Claude配置
   */
  async writeClaudeConfig(configPath, config) {
    console.log('\n💾 写入Claude配置...');
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    console.log('✅ 配置文件已更新');
  }

  /**
   * 创建启动脚本
   */
  async createStartupScript() {
    console.log('\n📜 创建启动脚本...');
    
    const startScript = path.join(this.scaffoldPath, 'scripts', 'start-mcp.sh');
    const startContent = `#!/bin/bash
# TDD脚手架MCP服务启动脚本

cd "${this.scaffoldPath}"
echo "🚀 启动TDD脚手架MCP服务..."
node mcp-server/index.js
`;
    
    await fs.writeFile(startScript, startContent);
    await fs.chmod(startScript, '755');
    
    if (os.platform() === 'win32') {
      const batScript = path.join(this.scaffoldPath, 'scripts', 'start-mcp.bat');
      const batContent = `@echo off
cd /d "${this.scaffoldPath}"
echo 🚀 启动TDD脚手架MCP服务...
node mcp-server/index.js
`;
      await fs.writeFile(batScript, batContent);
    }
    
    console.log('✅ 启动脚本已创建');
  }

  /**
   * 显示完成信息
   */
  showCompletionMessage() {
    console.log('\n🎉 TDD脚手架MCP服务安装完成！');
    console.log('=====================================');
    console.log('');
    console.log('📝 下一步操作:');
    console.log('');
    console.log('1. 重启Claude Desktop应用');
    console.log('2. 在Claude中测试MCP工具:');
    console.log('   - 使用 tdd_initialize 初始化项目');
    console.log('   - 使用 tdd_scan_project 扫描项目');
    console.log('   - 使用 tdd_switch_phase 切换TDD阶段');
    console.log('');
    console.log('🔧 可用的MCP工具:');
    console.log('   - tdd_initialize: 初始化TDD项目');
    console.log('   - tdd_scan_project: 项目扫描分析');
    console.log('   - tdd_deep_analyze: 深度项目分析');
    console.log('   - tdd_switch_phase: 切换TDD阶段');
    console.log('   - tdd_create_feature: 创建新特性');
    console.log('   - tdd_get_status: 获取TDD状态');
    console.log('   - tdd_validate_path: 验证文件路径');
    console.log('');
    console.log('📚 更多信息:');
    console.log(`   项目路径: ${this.scaffoldPath}`);
    console.log('   文档: README.md');
    console.log('');
    console.log('🎯 开始使用TDD脚手架进行高效开发吧！');
  }
}

// 如果直接运行此文件，执行安装
if (import.meta.url === `file://${process.argv[1]}`) {
  const installer = new MCPInstaller();
  installer.install().catch(error => {
    console.error('💥 安装失败:', error);
    process.exit(1);
  });
}

export { MCPInstaller };