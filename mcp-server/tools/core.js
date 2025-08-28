#!/usr/bin/env node

/**
 * MCP TDD 智能核心工具实现
 * 智能执行计划模式：实现MCP与Claude Code的智能协调
 * 
 * 设计理念：
 * - MCP: 意图识别、状态管理、执行计划生成
 * - Claude: 计划解析、agent切换、任务执行  
 * - Hooks: 权限控制、阶段保护、反模式阻断
 */

import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('SmartTDDCore');

// 获取claude-assets路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 修正路径：从tools目录向上两级到mcp-server，再向上一级到项目根目录
const CLAUDE_ASSETS_PATH = path.resolve(__dirname, '../../../claude-assets');

/**
 * 统一的MCP返回格式
 * @param {string|object} content - 要返回的内容
 * @returns {object} 标准MCP格式
 */
function formatMCPResponse(content) {
  const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  return {
    content: [{
      type: 'text',
      text: text
    }]
  };
}

/**
 * 检测项目技术类型
 * @param {string} projectRoot - 项目根目录
 * @returns {string} 项目类型
 */
async function detectProjectType(projectRoot) {
  if (await fs.pathExists(path.join(projectRoot, 'pom.xml'))) {
    const content = await fs.readFile(path.join(projectRoot, 'pom.xml'), 'utf8');
    return content.includes('spring-boot') ? 'java-spring-boot' : 'java';
  }
  
  if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
    try {
      const pkg = await fs.readJson(path.join(projectRoot, 'package.json'));
      if (pkg.dependencies?.express || pkg.dependencies?.['@nestjs/core']) {
        return 'node-express';
      }
      return 'nodejs';
    } catch (e) {
      return 'nodejs';
    }
  }
  
  if (await fs.pathExists(path.join(projectRoot, 'requirements.txt')) ||
      await fs.pathExists(path.join(projectRoot, 'pyproject.toml'))) {
    return 'python';
  }
  
  return 'generic';
}

/**
 * 智能检测项目的测试命令
 * @param {string} projectRoot - 项目根目录
 * @param {string} projectType - 项目类型
 * @returns {Promise<string>} 测试命令
 */
async function getTestCommand(projectRoot, projectType) {
  try {
    // 优先从项目配置文件中读取实际命令
    
    // 检查 package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const pkg = await fs.readJson(packageJsonPath);
        if (pkg.scripts?.test && pkg.scripts.test !== 'echo "Error: no test specified" && exit 1') {
          logger.info(`检测到package.json中的测试命令: ${pkg.scripts.test}`);
          return 'npm test';
        }
        if (pkg.scripts?.['test:unit']) return 'npm run test:unit';
        if (pkg.scripts?.jest) return 'npm run jest';
        if (pkg.scripts?.mocha) return 'npm run mocha';
      } catch (e) {
        logger.warn('读取package.json失败:', e.message);
      }
    }
    
    // 检查 pom.xml (Java/Maven项目)
    const pomPath = path.join(projectRoot, 'pom.xml');
    if (await fs.pathExists(pomPath)) {
      logger.info('检测到Maven项目，使用mvn test');
      // 使用项目配置中的Maven路径
      const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
      if (await fs.pathExists(settingsPath)) {
        try {
          const settings = await fs.readJson(settingsPath);
          if (settings.tools?.maven) {
            return `${settings.tools.maven} test`;
          }
        } catch (e) {
          logger.warn('读取项目设置失败:', e.message);
        }
      }
      // 默认Maven命令
      return '/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test';
    }
    
    // 按项目类型返回默认命令
    const defaultCommands = {
      'java-spring-boot': 'mvn test',
      'java': 'mvn test',
      'node-express': 'npm test',
      'nodejs': 'npm test',
      'python': 'python -m pytest',
      'generic': 'echo "请配置测试命令"'
    };
    
    return defaultCommands[projectType] || defaultCommands['generic'];
    
  } catch (error) {
    logger.error('智能检测测试命令失败:', error);
    return 'echo "测试命令检测失败"';
  }
}

/**
 * 工具1: tdd_init - 项目初始化
 * 设置TDD项目的基础结构和配置文件
 */
export async function initProject(args) {
  const { projectRoot, force = false } = args;
  
  try {
    const claudeDir = path.join(projectRoot, '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');
    const tddStatePath = path.join(claudeDir, 'tdd-state.json');
    
    // 检查是否已初始化
    if (!force && await fs.pathExists(claudeDir) && await fs.pathExists(settingsPath)) {
      return formatMCPResponse(`✅ 项目已经初始化
      
TDD环境已就绪！使用以下命令开始：
- tdd_smart_command("写测试") - 进入RED阶段
- tdd_smart_command("status") - 查看当前状态`);
    }
    
    logger.info('🔧 开始TDD项目初始化...');
    
    // 创建.claude目录
    await fs.ensureDir(claudeDir);
    
    // 检测项目类型和配置
    const projectType = await detectProjectType(projectRoot);
    const testCommand = await getTestCommand(projectRoot, projectType);
    
    logger.info(`📋 项目类型: ${projectType}`);
    logger.info(`🧪 测试命令: ${testCommand}`);
    
    // 复制claude-assets到.claude目录
    try {
      if (await fs.pathExists(CLAUDE_ASSETS_PATH)) {
        const assetsTarget = claudeDir;
        await fs.copy(CLAUDE_ASSETS_PATH, assetsTarget, {
          overwrite: force,
          filter: (src) => !src.includes('node_modules')
        });
        logger.info('📁 Claude assets 复制完成');
      } else {
        logger.warn(`⚠️  Claude assets 目录不存在: ${CLAUDE_ASSETS_PATH}`);
      }
    } catch (copyError) {
      logger.error('复制assets失败:', copyError);
      // 继续执行，不因为assets复制失败而中断
    }
    
    // 创建settings.json
    const settings = {
      project: {
        name: path.basename(projectRoot),
        type: projectType,
        testCommand: testCommand,
        initTime: new Date().toISOString()
      },
      tdd: {
        enforcePhases: true,
        autoTest: false
      },
      tools: {
        maven: '/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd'
      }
    };
    
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    logger.info('⚙️  项目配置已创建');
    
    // 初始化TDD状态
    const initialState = {
      currentPhase: 'READY',
      featureId: null,
      timestamp: new Date().toISOString(),
      description: 'TDD环境已就绪',
      isInitialized: true
    };
    
    await fs.writeJson(tddStatePath, initialState, { spaces: 2 });
    logger.info('📊 TDD状态已初始化');
    
    const result = `🎉 TDD项目初始化成功！

📋 项目信息:
- 名称: ${settings.project.name}
- 类型: ${projectType}
- 测试命令: ${testCommand}

🔧 已创建:
- .claude/ 目录和配置文件
- TDD状态管理
- 项目设置文件

📚 下一步:
1. tdd_smart_command("写测试") - 开始第一个TDD循环
2. tdd_smart_command("status") - 查看项目状态
3. tdd_smart_command("help") - 查看帮助信息

🚀 开始你的TDD之旅！`;

    return formatMCPResponse(result);
    
  } catch (error) {
    logger.error('项目初始化失败:', error);
    return formatMCPResponse(`❌ 初始化失败: ${error.message}`);
  }
}

/**
 * 工具2: tdd_phase - TDD阶段管理
 * 切换和管理TDD的不同阶段（RED/GREEN/REFACTOR/READY）
 */
export async function switchPhase(args) {
  const { projectRoot, phase, featureId = null } = args;
  
  try {
    const tddStatePath = path.join(projectRoot, '.claude', 'tdd-state.json');
    
    // 验证阶段参数
    const validPhases = ['RED', 'GREEN', 'REFACTOR', 'READY'];
    if (!validPhases.includes(phase)) {
      return formatMCPResponse(`❌ 无效的TDD阶段: ${phase}
      
有效阶段: ${validPhases.join(', ')}`);
    }
    
    // 读取当前状态
    let currentState = {};
    if (await fs.pathExists(tddStatePath)) {
      currentState = await fs.readJson(tddStatePath);
    }
    
    const previousPhase = currentState.currentPhase || 'UNKNOWN';
    
    // 更新状态
    const newState = {
      ...currentState,
      currentPhase: phase,
      featureId: featureId || currentState.featureId,
      timestamp: new Date().toISOString(),
      phaseStartTime: new Date().toISOString(),
      description: `TDD ${phase}阶段 - ${getPhaseDescription(phase)}`,
      previousPhase: previousPhase,
      phaseHistory: [
        ...(currentState.phaseHistory || []),
        {
          phase: previousPhase,
          endTime: new Date().toISOString()
        }
      ].slice(-10) // 保留最近10次变更
    };
    
    await fs.writeJson(tddStatePath, newState, { spaces: 2 });
    
    const phaseEmojis = {
      RED: '🔴',
      GREEN: '🟢', 
      REFACTOR: '🔧',
      READY: '⚪'
    };
    
    const result = `${phaseEmojis[phase]} TDD阶段切换成功！

🔄 阶段变更: ${previousPhase} → ${phase}
📝 描述: ${newState.description}
⏰ 时间: ${new Date().toLocaleString()}
${featureId ? `🎯 特性: ${featureId}` : ''}

💡 ${phase}阶段重点:
${getPhaseGuidance(phase)}

📊 使用 tdd_smart_command("status") 查看详细状态`;

    logger.info(`🔄 TDD阶段切换: ${previousPhase} → ${phase}`);
    return formatMCPResponse(result);
    
  } catch (error) {
    logger.error('阶段切换失败:', error);
    return formatMCPResponse(`❌ 阶段切换失败: ${error.message}`);
  }
}

/**
 * 获取阶段描述
 */
function getPhaseDescription(phase) {
  const descriptions = {
    RED: '编写失败测试',
    GREEN: '最小实现',
    REFACTOR: '重构优化',
    READY: '环境就绪'
  };
  return descriptions[phase] || '未知阶段';
}

/**
 * 获取阶段指导
 */
function getPhaseGuidance(phase) {
  const guidance = {
    RED: '- 编写会失败的测试用例\n- 明确期望的功能行为\n- 确保测试失败原因明确',
    GREEN: '- 编写最小代码使测试通过\n- 避免过度设计\n- 专注解决当前失败测试',
    REFACTOR: '- 改善代码质量和结构\n- 消除重复代码\n- 保持所有测试通过',
    READY: '- 准备开发环境\n- 规划功能特性\n- 开始第一个TDD循环'
  };
  return guidance[phase] || '无特定指导';
}

/**
 * 工具3: tdd_test - 测试执行
 * 运行项目测试，提供TDD阶段相关的建议和反馈
 */
export async function runTest(args) {
  const { projectRoot, command } = args;
  
  try {
    // 读取项目配置确定测试命令
    let testCommand = command;
    if (!testCommand) {
      const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
      if (await fs.pathExists(settingsPath)) {
        const settings = await fs.readJson(settingsPath);
        testCommand = settings.project?.testCommand || 'npm test';
      } else {
        testCommand = 'npm test';
      }
    }
    
    // 读取当前TDD阶段
    const tddStatePath = path.join(projectRoot, '.claude', 'tdd-state.json');
    let currentPhase = 'UNKNOWN';
    if (await fs.pathExists(tddStatePath)) {
      const tddState = await fs.readJson(tddStatePath);
      currentPhase = tddState.currentPhase || 'UNKNOWN';
    }
    
    logger.info(`🧪 执行测试: ${testCommand} (${currentPhase}阶段)`);
    
    const startTime = Date.now();
    let success = false;
    let output = '';
    let error = '';
    
    try {
      output = execSync(testCommand, {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 60000, // 60秒超时
        stdio: ['pipe', 'pipe', 'pipe']
      });
      success = true;
    } catch (execError) {
      success = false;
      output = execError.stdout || '';
      error = execError.stderr || execError.message || '';
    }
    
    const duration = Date.now() - startTime;
    
    // TDD阶段建议
    const getTDDAdvice = (phase, testSuccess) => {
      if (testSuccess) {
        switch (phase) {
          case 'RED':
            return '⚠️  RED阶段：测试不应该通过！请检查测试是否正确描述了待实现的功能。';
          case 'GREEN':
            return '✅ GREEN阶段：测试通过！现在可以考虑切换到REFACTOR阶段优化代码。';
          case 'REFACTOR':
            return '✅ REFACTOR阶段：测试保持通过，可以安全继续重构。';
          default:
            return '✅ 所有测试通过！';
        }
      } else {
        switch (phase) {
          case 'RED':
            return '✅ RED阶段：测试失败是预期的！现在可以切换到GREEN阶段实现代码。';
          case 'GREEN':
            return '❌ GREEN阶段：测试应该通过。请检查实现代码。';
          case 'REFACTOR':
            return '❌ REFACTOR阶段：重构破坏了测试！请修复后再继续。';
          default:
            return '测试失败，请检查代码实现。';
        }
      }
    };
    
    const advice = getTDDAdvice(currentPhase, success);
    
    const result = `🧪 测试执行${success ? '成功' : '失败'} (${duration}ms)

阶段: ${currentPhase}
命令: ${testCommand}
结果: ${success ? '✅ 通过' : '❌ 失败'}

${success ? '📊 测试输出:' : '❌ 错误信息:'}
${(output + error).trim()}

💡 TDD建议:
${advice}`;

    return formatMCPResponse(result);
    
  } catch (error) {
    logger.error('测试执行失败:', error);
    return formatMCPResponse(`❌ 测试执行失败: ${error.message}`);
  }
}

/**
 * 工具4: tdd_status - 状态查询
 * 读取并显示当前TDD状态和项目配置
 */
export async function getStatus(args) {
  const { projectRoot } = args;
  
  try {
    const claudeDir = path.join(projectRoot, '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');
    const tddStatePath = path.join(claudeDir, 'tdd-state.json');
    
    // 检查初始化状态
    if (!await fs.pathExists(claudeDir)) {
      return formatMCPResponse(`❌ 项目未初始化
      
请先运行: tdd_smart_command("初始化") 来初始化TDD项目结构`);
    }
    
    // 读取配置
    let settings = {};
    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath);
    }
    
    // 读取TDD状态
    let tddState = {};
    if (await fs.pathExists(tddStatePath)) {
      tddState = await fs.readJson(tddStatePath);
    }
    
    // 检查claude-assets完整性
    const requiredAssets = ['agents', 'commands', 'hooks', 'schemas'];
    const assetStatus = {};
    for (const asset of requiredAssets) {
      assetStatus[asset] = await fs.pathExists(path.join(claudeDir, asset)) ? '✅' : '❌';
    }
    
    // 计算阶段持续时间
    let phaseDuration = 0;
    if (tddState.phaseStartTime) {
      phaseDuration = Math.round((Date.now() - new Date(tddState.phaseStartTime).getTime()) / 60000);
    }
    
    const phaseIcons = {
      READY: '⚪',
      RED: '🔴',
      GREEN: '🟢',
      REFACTOR: '🔧'
    };
    
    const currentPhase = tddState.currentPhase || 'UNKNOWN';
    const phaseIcon = phaseIcons[currentPhase] || '❓';
    
    const result = `📊 TDD项目状态报告

🏢 项目信息:
- 名称: ${settings.project?.name || 'Unknown'}
- 类型: ${settings.project?.type || 'Unknown'}
- 初始化时间: ${settings.project?.initTime ? new Date(settings.project.initTime).toLocaleString() : 'Unknown'}

${phaseIcon} 当前TDD阶段: ${currentPhase}
- 描述: ${tddState.description || 'N/A'}
- 开始时间: ${tddState.phaseStartTime ? new Date(tddState.phaseStartTime).toLocaleString() : 'N/A'}
- 持续时间: ${phaseDuration} 分钟
- 特性ID: ${tddState.featureId || 'N/A'}

🧪 测试配置:
- 测试命令: ${settings.project?.testCommand || 'N/A'}
- 自动测试: ${settings.tdd?.autoTest ? '启用' : '禁用'}

📁 资源检查:
${Object.entries(assetStatus).map(([asset, status]) => `- ${asset}: ${status}`).join('\n')}

⚡ 智能命令:
- tdd_smart_command("写测试") - 进入RED阶段
- tdd_smart_command("实现") - 进入GREEN阶段
- tdd_smart_command("重构") - 进入REFACTOR阶段
- tdd_smart_command("测试") - 运行测试`;

    return formatMCPResponse(result);
    
  } catch (error) {
    logger.error('状态查询失败:', error);
    return formatMCPResponse(`❌ 状态查询失败: ${error.message}`);
  }
}

/**
 * 工具5: tdd_smart_command - 智能执行计划路由器
 * 实现完整的意图识别→计划生成→状态协调→指令返回流程
 */
export async function routeCommand(args) {
  const { projectRoot, input } = args;
  
  try {
    logger.info(`🤖 智能执行计划分析: "${input}"`);
    
    // 1. 获取当前TDD状态
    const currentState = await getCurrentTDDState(projectRoot);
    logger.debug(`当前状态: ${JSON.stringify(currentState)}`);
    
    // 2. 分析用户意图
    const userIntent = analyzeUserIntent(input.toLowerCase().trim());
    logger.info(`意图识别: ${userIntent.type} (置信度: ${userIntent.confidence})`);
    
    // 3. 生成智能执行计划
    const executionPlan = await generateSmartExecutionPlan(userIntent, currentState, projectRoot);
    
    // 4. 执行MCP层状态变更
    if (executionPlan.mcpActions?.length > 0) {
      await executeMCPActions(executionPlan.mcpActions, projectRoot);
    }
    
    // 5. 格式化Claude执行指导
    const claudeInstructions = formatClaudeInstructions(executionPlan);
    
    logger.info(`✅ 智能执行计划生成完成`);
    return formatMCPResponse(claudeInstructions);
    
  } catch (error) {
    logger.error('智能执行计划失败:', error);
    return formatMCPResponse(`❌ 智能执行计划失败: ${error.message}`);
  }
}

/**
 * 获取当前TDD工作区状态
 */
async function getCurrentTDDState(projectRoot) {
  try {
    const workspacePath = path.join(projectRoot, '.claude', 'tdd-workspace.json');
    const legacyStatePath = path.join(projectRoot, '.claude', 'tdd-state.json');
    
    // 优先读取新的workspace文件
    if (await fs.pathExists(workspacePath)) {
      const workspace = await fs.readJson(workspacePath);
      const currentFeature = workspace.features[workspace.currentFeature];
      
      return {
        currentPhase: currentFeature?.currentPhase || 'READY',
        featureId: workspace.currentFeature,
        timestamp: new Date().toISOString(),
        isInitialized: true,
        workspace: workspace
      };
    }
    
    // 兼容旧的state文件
    if (await fs.pathExists(legacyStatePath)) {
      const state = await fs.readJson(legacyStatePath);
      return {
        ...state,
        isInitialized: true
      };
    }
  } catch (error) {
    logger.warn('读取TDD状态失败:', error);
  }
  
  return {
    currentPhase: 'READY',
    featureId: null,
    timestamp: new Date().toISOString(),
    isInitialized: false,
    phaseHistory: []
  };
}

/**
 * 获取或创建TDD工作区
 */
async function getOrCreateWorkspace(projectRoot) {
  const workspacePath = path.join(projectRoot, '.claude', 'tdd-workspace.json');
  
  try {
    if (await fs.pathExists(workspacePath)) {
      return await fs.readJson(workspacePath);
    }
  } catch (error) {
    logger.warn('读取工作区失败:', error);
  }
  
  // 创建默认工作区
  const defaultWorkspace = {
    currentFeature: null,
    features: {},
    completedFeatures: [],
    globalPhaseHistory: [],
    createdAt: new Date().toISOString(),
    version: "1.0"
  };
  
  await fs.ensureDir(path.dirname(workspacePath));
  await fs.writeJson(workspacePath, defaultWorkspace, { spaces: 2 });
  return defaultWorkspace;
}

/**
 * 保存工作区状态
 */
async function saveWorkspace(projectRoot, workspace) {
  const workspacePath = path.join(projectRoot, '.claude', 'tdd-workspace.json');
  workspace.lastModified = new Date().toISOString();
  await fs.writeJson(workspacePath, workspace, { spaces: 2 });
}

/**
 * 创建新特性
 */
async function createFeature(args) {
  const { projectRoot, featureName, description = '' } = args;
  
  try {
    const workspace = await getOrCreateWorkspace(projectRoot);
    const featureId = featureName.toUpperCase().replace(/\s+/g, '_');
    
    // 检查特性是否已存在
    if (workspace.features[featureId]) {
      return formatMCPResponse(`❌ 特性 "${featureName}" 已存在！
      
当前特性状态: ${workspace.features[featureId].status}
当前阶段: ${workspace.features[featureId].currentPhase}

💡 使用 tdd_smart_command("切换到 ${featureName}") 来切换到该特性`);
    }
    
    // 创建新特性
    const newFeature = {
      id: featureId,
      title: featureName,
      description: description,
      currentPhase: 'RED',
      cycles: [],
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      testFiles: [],
      implFiles: []
    };
    
    workspace.features[featureId] = newFeature;
    workspace.currentFeature = featureId;
    
    await saveWorkspace(projectRoot, workspace);
    
    logger.info(`✨ 创建新特性: ${featureName} (${featureId})`);
    
    return formatMCPResponse(`✨ 特性创建成功！

📝 特性信息:
- 名称: ${featureName}
- ID: ${featureId}
- 状态: 进行中
- 当前阶段: RED (准备编写测试)

🎯 下一步:
1. 编写失败的测试用例
2. 确保测试失败
3. 进入GREEN阶段实现功能

💡 已自动切换到该特性，现在可以开始TDD开发！`);
    
  } catch (error) {
    logger.error('创建特性失败:', error);
    return formatMCPResponse(`❌ 创建特性失败: ${error.message}`);
  }
}

/**
 * 切换特性
 */
async function switchFeature(args) {
  const { projectRoot, featureName } = args;
  
  try {
    const workspace = await getOrCreateWorkspace(projectRoot);
    const featureId = featureName.toUpperCase().replace(/\s+/g, '_');
    
    // 检查特性是否存在
    if (!workspace.features[featureId]) {
      const availableFeatures = Object.keys(workspace.features);
      return formatMCPResponse(`❌ 特性 "${featureName}" 不存在！

📋 可用特性:
${availableFeatures.length > 0 ? 
  availableFeatures.map(id => `- ${workspace.features[id].title} (${id})`).join('\n') :
  '暂无可用特性'
}

💡 使用 tdd_smart_command("新功能 ${featureName}") 来创建新特性`);
    }
    
    // 保存当前特性状态（如果有的话）
    if (workspace.currentFeature && workspace.features[workspace.currentFeature]) {
      workspace.features[workspace.currentFeature].lastSwitchedAt = new Date().toISOString();
    }
    
    // 切换到目标特性
    workspace.currentFeature = featureId;
    const targetFeature = workspace.features[featureId];
    
    await saveWorkspace(projectRoot, workspace);
    
    logger.info(`🔄 切换特性: ${workspace.currentFeature} → ${featureId}`);
    
    return formatMCPResponse(`🔄 特性切换成功！

📝 当前特性:
- 名称: ${targetFeature.title}
- ID: ${featureId}
- 状态: ${targetFeature.status}
- 当前阶段: ${targetFeature.currentPhase}
- 循环次数: ${targetFeature.cycles.length}

🎯 继续 ${targetFeature.currentPhase} 阶段的开发！`);
    
  } catch (error) {
    logger.error('切换特性失败:', error);
    return formatMCPResponse(`❌ 切换特性失败: ${error.message}`);
  }
}

/**
 * 完成当前特性
 */
async function completeFeature(args) {
  const { projectRoot } = args;
  
  try {
    const workspace = await getOrCreateWorkspace(projectRoot);
    
    if (!workspace.currentFeature) {
      return formatMCPResponse(`❌ 当前没有活跃的特性！

💡 使用 tdd_smart_command("新功能 <名称>") 创建新特性`);
    }
    
    const currentFeature = workspace.features[workspace.currentFeature];
    if (!currentFeature) {
      return formatMCPResponse(`❌ 当前特性不存在！`);
    }
    
    // 标记特性完成
    currentFeature.status = 'completed';
    currentFeature.completedAt = new Date().toISOString();
    
    // 移动到已完成列表
    workspace.completedFeatures.push(workspace.currentFeature);
    delete workspace.features[workspace.currentFeature];
    workspace.currentFeature = null;
    
    await saveWorkspace(projectRoot, workspace);
    await generateFeaturesList(projectRoot, workspace);
    
    logger.info(`✅ 特性完成: ${currentFeature.title}`);
    
    return formatMCPResponse(`🎉 特性完成！

✅ 已完成特性:
- 名称: ${currentFeature.title}
- 总循环数: ${currentFeature.cycles.length}
- 完成时间: ${new Date().toLocaleString()}

📋 下一步:
- 创建新特性继续开发
- 或查看任务列表了解进度`);
    
  } catch (error) {
    logger.error('完成特性失败:', error);
    return formatMCPResponse(`❌ 完成特性失败: ${error.message}`);
  }
}

/**
 * 列出所有特性
 */
async function listFeatures(args) {
  const { projectRoot } = args;
  
  try {
    const workspace = await getOrCreateWorkspace(projectRoot);
    await generateFeaturesList(projectRoot, workspace);
    
    const inProgressFeatures = Object.entries(workspace.features);
    const completedCount = workspace.completedFeatures.length;
    
    let result = `📋 TDD特性列表

🚧 进行中 (${inProgressFeatures.length}):
`;
    
    if (inProgressFeatures.length > 0) {
      for (const [id, feature] of inProgressFeatures) {
        const current = id === workspace.currentFeature ? ' 👈 当前' : '';
        result += `- ${feature.currentPhase === 'RED' ? '🔴' : feature.currentPhase === 'GREEN' ? '🟢' : '🔧'} ${feature.title} (${feature.currentPhase}阶段)${current}\n`;
      }
    } else {
      result += '暂无进行中的特性\n';
    }
    
    result += `
✅ 已完成 (${completedCount}):
`;
    
    if (completedCount > 0) {
      result += workspace.completedFeatures.map(id => `- ✅ ${id}`).join('\n');
    } else {
      result += '暂无已完成的特性';
    }
    
    result += `

💡 快速操作:
- tdd_smart_command("新功能 <名称>") - 创建新特性
- tdd_smart_command("切换到 <名称>") - 切换特性
- tdd_smart_command("完成功能") - 完成当前特性`;
    
    return formatMCPResponse(result);
    
  } catch (error) {
    logger.error('列出特性失败:', error);
    return formatMCPResponse(`❌ 列出特性失败: ${error.message}`);
  }
}

/**
 * 生成特性列表markdown文件
 */
async function generateFeaturesList(projectRoot, workspace) {
  const featuresListPath = path.join(projectRoot, '.claude', 'features-list.md');
  
  const inProgressFeatures = Object.entries(workspace.features);
  const completedFeatures = workspace.completedFeatures;
  
  let content = `# TDD特性列表

## 🚧 进行中
`;
  
  if (inProgressFeatures.length > 0) {
    for (const [id, feature] of inProgressFeatures) {
      const emoji = feature.currentPhase === 'RED' ? '🔴' : feature.currentPhase === 'GREEN' ? '🟢' : '🔧';
      const current = id === workspace.currentFeature ? ' (当前)' : '';
      content += `- [ ] ${id} - ${feature.title} (${feature.currentPhase}阶段)${current}\n`;
    }
  } else {
    content += '暂无进行中的特性\n';
  }
  
  content += `
## ✅ 已完成
`;
  
  if (completedFeatures.length > 0) {
    content += completedFeatures.map(id => `- [x] ${id}`).join('\n');
  } else {
    content += '暂无已完成的特性';
  }
  
  content += `
## 📋 待开发
- [ ] 在这里添加计划开发的特性...

---
*由 TDD智能协调系统自动生成*
`;
  
  await fs.writeFile(featuresListPath, content, 'utf8');
}

/**
 * 分析用户意图
 */
function analyzeUserIntent(input) {
  // 检查是否是创建新特性的指令
  const newFeatureMatch = input.match(/(?:新功能|创建功能|new feature)\s+(.+)/i);
  if (newFeatureMatch) {
    return {
      type: 'new-feature',
      confidence: 1.0,
      featureName: newFeatureMatch[1].trim(),
      matchedPattern: newFeatureMatch[0],
      matchType: 'regex',
      originalInput: input
    };
  }

  // 检查是否是切换特性的指令
  const switchFeatureMatch = input.match(/(?:切换到|switch to)\s+(.+)/i);
  if (switchFeatureMatch) {
    return {
      type: 'switch-feature',
      confidence: 1.0,
      featureName: switchFeatureMatch[1].trim(),
      matchedPattern: switchFeatureMatch[0],
      matchType: 'regex',
      originalInput: input
    };
  }

  const patterns = [
    // 高置信度精确匹配
    { type: 'init', confidence: 1.0, patterns: ['初始化', '初始化项目', 'init', 'initialize'] },
    { type: 'red', confidence: 1.0, patterns: ['red', 'red阶段', '写测试', '编写测试', '测试先行'] },
    { type: 'green', confidence: 1.0, patterns: ['green', 'green阶段', '实现', '实现代码', '写代码'] },
    { type: 'refactor', confidence: 1.0, patterns: ['refactor', 'refactor阶段', '重构', '优化', '重构代码'] },
    { type: 'test', confidence: 1.0, patterns: ['test', '测试', '运行测试', '跑测试'] },
    { type: 'status', confidence: 1.0, patterns: ['status', '状态', '查看状态', '当前状态'] },
    
    // 特性管理相关
    { type: 'complete-feature', confidence: 1.0, patterns: ['完成功能', '功能完成', 'complete feature', '完成当前功能'] },
    { type: 'next-cycle', confidence: 1.0, patterns: ['下一轮', '新循环', 'next cycle', '开始下一轮'] },
    { type: 'list-features', confidence: 1.0, patterns: ['查看任务', '任务列表', 'list features', '特性列表', '功能列表'] },
    { type: 'switch-workspace', confidence: 1.0, patterns: ['切换工作区', 'switch workspace'] },
    
    // 中等置信度模糊匹配
    { type: 'red', confidence: 0.8, patterns: ['开始写测试', '先写测试', '测试驱动'] },
    { type: 'green', confidence: 0.8, patterns: ['开始实现', '写业务代码', '让测试通过'] },
    { type: 'refactor', confidence: 0.8, patterns: ['改进代码', '优化性能', '代码重构'] },
    
    // 低置信度泛化匹配
    { type: 'red', confidence: 0.6, patterns: ['开始', '开始开发', '第一步'] },
    { type: 'test', confidence: 0.7, patterns: ['验证', '检查', '测试一下'] }
  ];
  
  for (const pattern of patterns) {
    for (const p of pattern.patterns) {
      if (input.includes(p)) {
        return {
          type: pattern.type,
          confidence: pattern.confidence,
          matchedPattern: p,
          matchType: input === p ? 'exact' : 'fuzzy',
          originalInput: input
        };
      }
    }
  }
  
  return {
    type: 'unknown',
    confidence: 0.0,
    matchedPattern: null,
    matchType: 'none',
    originalInput: input
  };
}

/**
 * 生成智能执行计划
 */
async function generateSmartExecutionPlan(intent, currentState, projectRoot) {
  const plan = {
    intent: intent,
    currentPhase: currentState.currentPhase,
    targetPhase: null,
    phaseTransition: null,
    mcpActions: [],
    agentRecommendation: 'assistant',
    taskDescription: '',
    filePermissions: { allowed: [], blocked: [] },
    nextSteps: []
  };
  
  switch (intent.type) {
    case 'init':
      plan.targetPhase = 'READY';
      plan.phaseTransition = `${currentState.currentPhase} → READY`;
      plan.mcpActions = [{ type: 'initProject' }];
      plan.agentRecommendation = 'assistant';
      plan.taskDescription = '初始化TDD项目环境和配置';
      plan.nextSteps = ['设置项目结构', '配置测试框架', '准备TDD开发环境'];
      break;
      
    case 'red':
      plan.targetPhase = 'RED';
      plan.phaseTransition = `${currentState.currentPhase} → RED`;
      plan.mcpActions = [{ type: 'switchPhase', phase: 'RED' }];
      plan.agentRecommendation = 'tdd-architect';
      plan.taskDescription = '编写失败的测试用例（TDD RED阶段）';
      plan.filePermissions = {
        allowed: ['tests/', '*.test.*', '*.spec.*'],
        blocked: ['src/', 'lib/', 'main/']
      };
      plan.nextSteps = [
        '编写会失败的测试用例',
        '确保测试失败原因明确（功能未实现）', 
        '运行测试验证失败状态',
        '完成后使用 tdd_smart_command("实现") 进入GREEN阶段'
      ];
      break;
      
    case 'green':
      plan.targetPhase = 'GREEN';
      plan.phaseTransition = `${currentState.currentPhase} → GREEN`;
      plan.mcpActions = [{ type: 'switchPhase', phase: 'GREEN' }];
      plan.agentRecommendation = 'tdd-architect';
      plan.taskDescription = '编写最小实现代码使测试通过（TDD GREEN阶段）';
      plan.filePermissions = {
        allowed: ['src/', 'lib/', 'main/', '*.js', '*.java', '*.py'],
        blocked: ['tests/']
      };
      plan.nextSteps = [
        '编写最小代码使测试通过',
        '避免过度设计，只满足当前测试',
        '运行测试确认全部通过',
        '完成后使用 tdd_smart_command("重构") 进入REFACTOR阶段'
      ];
      break;
      
    case 'refactor':
      plan.targetPhase = 'REFACTOR';
      plan.phaseTransition = `${currentState.currentPhase} → REFACTOR`;
      plan.mcpActions = [{ type: 'switchPhase', phase: 'REFACTOR' }];
      plan.agentRecommendation = 'tdd-architect';
      plan.taskDescription = '重构改进代码质量（TDD REFACTOR阶段）';
      plan.filePermissions = {
        allowed: ['src/', 'lib/', 'main/', '*.js', '*.java', '*.py'],
        blocked: ['tests/']
      };
      plan.nextSteps = [
        '改进代码质量和设计',
        '消除重复代码，优化性能',
        '运行测试确保重构安全',
        '完成后可开始下一个功能的RED阶段'
      ];
      break;
      
    case 'test':
      plan.taskDescription = '运行测试并分析结果';
      plan.mcpActions = [{ type: 'runTest' }];
      plan.nextSteps = ['分析测试结果', '根据TDD阶段调整下一步行动'];
      break;
      
    case 'status':
      plan.taskDescription = '查看当前TDD状态和项目配置';
      plan.mcpActions = [{ type: 'getStatus' }];
      plan.nextSteps = ['了解当前阶段', '计划下一步TDD操作'];
      break;
      
    case 'new-feature':
      plan.taskDescription = `创建新特性: ${intent.featureName}`;
      plan.targetPhase = 'RED';
      plan.phaseTransition = `${currentState.currentPhase} → RED`;
      plan.mcpActions = [
        { type: 'createFeature', featureName: intent.featureName },
        { type: 'switchPhase', phase: 'RED' }
      ];
      plan.agentRecommendation = 'tdd-architect';
      plan.filePermissions = {
        allowed: ['tests/', '*.test.*', '*.spec.*'],
        blocked: ['src/', 'lib/', 'main/']
      };
      plan.nextSteps = [
        `为特性 "${intent.featureName}" 创建测试文件`,
        '编写第一个失败的测试用例',
        '运行测试确认失败',
        '准备进入GREEN阶段实现功能'
      ];
      break;
      
    case 'switch-feature':
      plan.taskDescription = `切换到特性: ${intent.featureName}`;
      plan.mcpActions = [{ type: 'switchFeature', featureName: intent.featureName }];
      plan.agentRecommendation = 'assistant';
      plan.nextSteps = [
        `加载特性 "${intent.featureName}" 的上下文`,
        '了解当前开发状态',
        '继续TDD开发流程'
      ];
      break;
      
    case 'complete-feature':
      plan.taskDescription = '完成当前特性';
      plan.mcpActions = [{ type: 'completeFeature' }];
      plan.nextSteps = [
        '验证所有测试通过',
        '标记特性为完成状态',
        '创建下一个特性或休息'
      ];
      break;
      
    case 'list-features':
      plan.taskDescription = '查看所有特性列表';
      plan.mcpActions = [{ type: 'listFeatures' }];
      plan.nextSteps = [
        '查看当前进度',
        '选择要工作的特性',
        '计划下一步开发'
      ];
      break;
      
    default:
      plan.taskDescription = `无法识别的指令: ${intent.originalInput}`;
      plan.nextSteps = ['请使用明确的TDD命令，如："写测试"、"实现"、"重构"、"新功能 <名称>"'];
  }
  
  return plan;
}

/**
 * 执行MCP层动作
 */
async function executeMCPActions(actions, projectRoot) {
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'switchPhase':
          await switchPhase({ projectRoot, phase: action.phase });
          break;
        case 'initProject':
          await initProject({ projectRoot });
          break;
        case 'runTest':
          await runTest({ projectRoot });
          break;
        case 'getStatus':
          await getStatus({ projectRoot });
          break;
        case 'createFeature':
          await createFeature({ projectRoot, featureName: action.featureName });
          break;
        case 'switchFeature':
          await switchFeature({ projectRoot, featureId: action.featureId });
          break;
        case 'completeFeature':
          await completeFeature({ projectRoot, featureId: action.featureId });
          break;
        case 'listFeatures':
          await listFeatures({ projectRoot });
          break;
        default:
          logger.warn(`未知的MCP动作: ${action.type}`);
      }
    } catch (error) {
      logger.error(`执行MCP动作失败 ${action.type}:`, error);
    }
  }
}

/**
 * 格式化Claude执行指导
 */
function formatClaudeInstructions(plan) {
  const phaseEmojis = {
    READY: '⚪',
    RED: '🔴',
    GREEN: '🟢',
    REFACTOR: '🔧'
  };
  
  if (plan.intent.type === 'unknown') {
    return `❌ 无法识别的TDD指令: "${plan.intent.originalInput}"

🤖 智能命令支持:
📝 自然语言：
  "初始化"、"写测试"、"实现"、"重构"、"测试"、"状态"
  "新功能 XXX"、"切换到 XXX"、"完成功能 XXX"、"功能列表"
  
⚡ 快捷命令：
  red      - 切换到RED阶段（编写失败测试）
  green    - 切换到GREEN阶段（最小实现）  
  refactor - 切换到REFACTOR阶段（重构优化）
  test     - 运行测试
  status   - 查看当前状态
  init     - 初始化项目

🚀 特性管理：
  新功能 登录系统     - 创建新的TDD特性
  切换到 USER_AUTH   - 切换到指定特性
  完成功能 USER_AUTH - 完成当前特性
  功能列表          - 显示所有特性状态

💡 示例用法:
  tdd_smart_command("写测试")       - 切换到RED阶段
  tdd_smart_command("实现功能")     - 切换到GREEN阶段
  tdd_smart_command("重构优化")     - 切换到REFACTOR阶段`;
  }
  
  // 特性管理指令的特殊处理
  if (['new-feature', 'switch-feature', 'complete-feature', 'list-features'].includes(plan.intent.type)) {
    return formatFeatureManagementInstructions(plan);
  }
  
  const emoji = phaseEmojis[plan.targetPhase] || '🤖';
  const permissions = plan.filePermissions.allowed.length > 0 ? 
    `\n**📁 文件编辑权限** (由TDD Guard自动强制执行):\n- ✅ **允许编辑**: ${plan.filePermissions.allowed.join(', ')}\n- ❌ **禁止编辑**: ${plan.filePermissions.blocked.join(', ')}` : '';
  
  const steps = plan.nextSteps.length > 0 ?
    `\n**📋 执行步骤**:\n${plan.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : '';
  
  const agentInstruction = plan.agentRecommendation !== 'assistant' ?
    `\n> **🤖 请立即切换为 \`${plan.agentRecommendation}\` 身份执行以下任务**` : '';
  
  return `# ${emoji} TDD智能协调激活

${emoji} **${plan.targetPhase}阶段激活 - 测试驱动开发**

${getTDDPhaseDescription(plan.targetPhase)}

**当前模式**: ${getTDDPhaseMode(plan.targetPhase)}
${getTDDPhaseFocus(plan.targetPhase)}
${agentInstruction}

**🎯 核心任务**: ${plan.taskDescription}
${permissions}
${steps}

**🔄 TDD阶段变更**: ${plan.phaseTransition}

---
**⚡ TDD智能协调系统** | 意图: ${plan.intent.type} | 置信度: ${Math.round(plan.intent.confidence * 100)}% | 匹配: ${plan.intent.matchType}`;
}

/**
 * 获取TDD阶段描述
 */
function getTDDPhaseDescription(phase) {
  const descriptions = {
    RED: '**TDD第一法则**: 在写出能够失败的单元测试之前，不允许写任何产品代码',
    GREEN: '**TDD第二法则**: 只允许写出刚好能够通过当前失败测试的产品代码',
    REFACTOR: '**TDD第三法则**: 在保持测试通过的前提下，持续改善代码质量',
    READY: '**TDD环境就绪**: 准备开始测试驱动开发循环'
  };
  return descriptions[phase] || '';
}

/**
 * 获取TDD阶段模式
 */
function getTDDPhaseMode(phase) {
  const modes = {
    RED: '测试先行模式',
    GREEN: '最小实现模式', 
    REFACTOR: '质量改进模式',
    READY: '准备模式'
  };
  return modes[phase] || '未知模式';
}

/**
 * 获取TDD阶段重点
 */
function getTDDPhaseFocus(phase) {
  const focuses = {
    RED: '- 🎯 专注编写会失败的测试用例\n- 🎯 明确定义期望的功能行为\n- 🎯 遵循AAA模式：Given-When-Then结构\n- 🎯 确保测试失败原因是"功能未实现"',
    GREEN: '- 🎯 编写最小代码使测试通过\n- 🎯 避免过度设计和提前优化\n- 🎯 专注解决当前失败的测试\n- 🎯 确保所有测试都通过',
    REFACTOR: '- 🎯 消除代码重复和坏味道\n- 🎯 改善代码结构和可读性\n- 🎯 优化性能和设计模式\n- 🎯 保持测试始终通过',
    READY: '- 🎯 环境配置和工具准备\n- 🎯 项目结构初始化\n- 🎯 测试框架设置\n- 🎯 准备开始TDD循环'
  };
  return focuses[phase] || '';
}

/**
 * 获取帮助信息
 */
function getHelp() {
  const help = `🎯 MCP TDD 智能核心工具帮助

📦 5个核心工具:

1️⃣  tdd_init - 项目初始化
    初始化TDD项目，复制claude-assets，创建配置文件
    参数: projectRoot, force?
    
2️⃣  tdd_phase - TDD阶段管理
    切换TDD阶段：RED/GREEN/REFACTOR/READY
    参数: projectRoot, phase, featureId?
    
3️⃣  tdd_test - 测试执行
    运行项目测试并返回TDD建议
    参数: projectRoot, command?
    
4️⃣  tdd_status - 状态查询
    查看当前TDD状态和项目配置
    参数: projectRoot
    
5️⃣  tdd_smart_command - 智能执行计划
    自然语言意图识别和智能协调
    参数: projectRoot, input

🤖 智能执行计划模式:
📝 自然语言支持：
  "初始化"、"写测试"、"实现"、"重构"、"测试"、"状态"
  
⚡ 快捷命令：
  red/green/refactor/test/status/init

🔄 标准TDD流程:
  1. tdd_smart_command("初始化") - 初始化项目
  2. tdd_smart_command("写测试") - RED阶段
  3. tdd_smart_command("实现") - GREEN阶段  
  4. tdd_smart_command("重构") - REFACTOR阶段

💡 智能协调架构:
  MCP: 意图识别、状态管理、执行计划生成
  Claude: 计划解析、agent切换、任务执行
  Hooks: 权限控制、阶段保护、反模式阻断`;

  return formatMCPResponse(help);
}

/**
 * 格式化特性管理指令
 */
function formatFeatureManagementInstructions(plan) {
  const typeEmojis = {
    'new-feature': '🚀',
    'switch-feature': '🔄', 
    'complete-feature': '✅',
    'list-features': '📋'
  };
  
  const typeDescriptions = {
    'new-feature': '新特性创建',
    'switch-feature': '特性切换',
    'complete-feature': '特性完成', 
    'list-features': '特性列表'
  };
  
  const emoji = typeEmojis[plan.intent.type] || '🤖';
  const description = typeDescriptions[plan.intent.type] || '特性管理';
  
  const steps = plan.nextSteps.length > 0 ?
    `\n**📋 执行步骤**:\n${plan.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}` : '';
  
  const agentInstruction = plan.agentRecommendation !== 'assistant' ?
    `\n> **🤖 请立即切换为 \`${plan.agentRecommendation}\` 身份执行以下任务**` : '';
  
  let specificInstructions = '';
  
  if (plan.intent.type === 'new-feature') {
    specificInstructions = `
**📝 创建特性流程**:
- 特性ID将自动标准化为大写下划线格式
- 初始化特性的TDD状态为READY阶段
- 创建特性专用的任务追踪文件
- 准备开始RED-GREEN-REFACTOR循环`;
  } else if (plan.intent.type === 'switch-feature') {
    specificInstructions = `
**🔄 特性切换流程**:
- 保存当前特性的TDD状态
- 加载目标特性的TDD状态
- 恢复目标特性的阶段上下文
- 继续目标特性的TDD循环`;
  } else if (plan.intent.type === 'complete-feature') {
    specificInstructions = `
**✅特性完成流程**:
- 将特性标记为已完成
- 记录完成时间和最终状态
- 移入已完成特性列表
- 生成特性完成报告`;
  } else if (plan.intent.type === 'list-features') {
    specificInstructions = `
**📋 特性列表显示**:
- 显示所有活跃特性及其状态
- 显示已完成的特性历史
- 显示当前激活的特性
- 提供特性管理建议`;
  }

  return `# ${emoji} 特性管理激活

${emoji} **${description} - 多特性TDD工作流**

**🎯 核心任务**: ${plan.taskDescription}

${specificInstructions}

${agentInstruction}

${steps}

**💡 特性管理说明**:
- 支持多个并行TDD特性开发
- 每个特性有独立的RED-GREEN-REFACTOR状态
- 自动生成特性任务追踪文件
- 保持TDD最佳实践的执行纪律

---
**⚡ TDD智能协调系统** | 意图: ${plan.intent.type} | 置信度: ${Math.round(plan.intent.confidence * 100)}% | 匹配: ${plan.intent.matchType}`;
}