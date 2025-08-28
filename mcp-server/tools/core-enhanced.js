#!/usr/bin/env node

/**
 * MCP TDD 增强核心工具实现
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

const logger = createLogger('EnhancedCore');

// 获取claude-assets路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLAUDE_ASSETS_PATH = path.resolve(__dirname, '../../../claude-assets');

/**
 * 统一的MCP返回格式
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
 * 智能执行计划路由器 - 核心增强功能
 * 实现完整的意图识别→计划生成→状态协调→指令返回流程
 */
export async function smartCommandRouter(args) {
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
 * 获取当前TDD状态
 */
async function getCurrentTDDState(projectRoot) {
  try {
    const tddStatePath = path.join(projectRoot, '.claude', 'tdd-state.json');
    if (await fs.pathExists(tddStatePath)) {
      const state = await fs.readJson(tddStatePath);
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
 * 智能用户意图分析
 * 支持自然语言、模糊匹配、上下文推理
 */
function analyzeUserIntent(input) {
  const intentPatterns = {
    // 初始化意图
    init: {
      exact: ['init', '初始化', 'initialize', 'setup'],
      fuzzy: ['初始化项目', '配置环境', '搭建环境', '开始项目', '项目设置'],
      confidence: 1.0
    },
    
    // TDD阶段意图
    red: {
      exact: ['red', '红灯', '写测试', 'write tests'],
      fuzzy: ['编写测试', '测试先行', '测试驱动', 'test first', '开始写测试', '先写测试'],
      confidence: 0.9
    },
    
    green: {
      exact: ['green', '绿灯', '实现', 'implement'],
      fuzzy: ['写代码', '实现功能', '编码', '开发', '写实现', '通过测试'],
      confidence: 0.9
    },
    
    refactor: {
      exact: ['refactor', '重构', '优化'],
      fuzzy: ['代码重构', '改进代码', '整理代码', '美化代码', '清理代码'],
      confidence: 0.9
    },
    
    // 操作意图
    test: {
      exact: ['test', '测试', 'run tests'],
      fuzzy: ['跑测试', '运行测试', '执行测试', '验证', '跑一下测试'],
      confidence: 0.8
    },
    
    status: {
      exact: ['status', '状态', 'check status'],
      fuzzy: ['查看状态', '当前状态', '项目状态', '现在状态', '查看情况'],
      confidence: 0.8
    },
    
    help: {
      exact: ['help', '帮助', 'usage'],
      fuzzy: ['使用帮助', '怎么用', '如何使用', '命令帮助'],
      confidence: 0.7
    }
  };
  
  // 精确匹配
  for (const [intentType, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns.exact) {
      if (input === pattern) {
        return {
          type: intentType,
          confidence: 1.0,
          matchedPattern: pattern,
          matchType: 'exact',
          originalInput: input
        };
      }
    }
  }
  
  // 模糊匹配
  for (const [intentType, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns.fuzzy) {
      if (input.includes(pattern) || pattern.includes(input)) {
        return {
          type: intentType,
          confidence: patterns.confidence,
          matchedPattern: pattern,
          matchType: 'fuzzy',
          originalInput: input
        };
      }
    }
  }
  
  return {
    type: 'unknown',
    confidence: 0,
    matchedPattern: null,
    matchType: 'none',
    originalInput: input
  };
}

/**
 * 生成智能执行计划
 * 基于意图和当前状态，生成完整的协调计划
 */
async function generateSmartExecutionPlan(userIntent, currentState, projectRoot) {
  const plan = {
    // 基础信息
    intent: userIntent,
    currentPhase: currentState.currentPhase,
    targetPhase: null,
    phaseTransition: null,
    
    // 执行信息
    mcpActions: [],
    claudeInstructions: null,
    agentRecommendation: null,
    taskDescription: null,
    
    // 权限和指导
    filePermissions: null,
    nextSteps: [],
    warnings: [],
    
    // 元信息
    timestamp: new Date().toISOString(),
    confidence: userIntent.confidence
  };
  
  switch (userIntent.type) {
    case 'init':
      plan.targetPhase = 'READY';
      plan.phaseTransition = `${currentState.currentPhase} → READY`;
      plan.mcpActions = [{ type: 'initProject' }];
      plan.taskDescription = 'TDD环境初始化和配置';
      plan.claudeInstructions = generateInitInstructions(currentState);
      plan.nextSteps = [
        'TDD环境配置完成',
        '使用 tdd_smart_command("写测试") 开始第一个功能的TDD开发',
        '或查看状态: tdd_smart_command("状态")'
      ];
      break;
      
    case 'red':
      plan.targetPhase = 'RED';
      plan.phaseTransition = `${currentState.currentPhase} → RED`;
      plan.mcpActions = [{ type: 'switchPhase', phase: 'RED' }];
      plan.agentRecommendation = 'tdd-architect';
      plan.taskDescription = '编写失败的测试用例（TDD RED阶段）';
      plan.filePermissions = {
        allowed: ['tests/', '*.test.*', '*.spec.*', '*Test.java', 'test_*.py'],
        blocked: ['src/', 'lib/', 'main/', 'yichao-*']
      };
      plan.claudeInstructions = generateRedPhaseInstructions();
      plan.nextSteps = [
        '编写会失败的测试用例',
        '确保测试失败原因明确（功能未实现）',
        '运行测试验证失败状态',
        '完成后使用 tdd_smart_command("实现") 进入GREEN阶段'
      ];
      
      // 阶段转换检查
      if (currentState.currentPhase === 'GREEN') {
        plan.warnings.push('🔄 从GREEN→RED：开始新功能开发');
      } else if (currentState.currentPhase === 'REFACTOR') {
        plan.warnings.push('🔄 从REFACTOR→RED：重构完成，开始新功能');
      }
      break;
      
    case 'green':
      plan.targetPhase = 'GREEN';
      plan.phaseTransition = `${currentState.currentPhase} → GREEN`;
      plan.mcpActions = [{ type: 'switchPhase', phase: 'GREEN' }];
      plan.agentRecommendation = 'tdd-architect';
      plan.taskDescription = '编写最小实现通过测试（TDD GREEN阶段）';
      plan.filePermissions = {
        allowed: ['src/', 'lib/', 'main/', 'yichao-*', '*.js', '*.java', '*.py'],
        blocked: ['tests/', '*.test.*', '*.spec.*']
      };
      plan.claudeInstructions = generateGreenPhaseInstructions();
      plan.nextSteps = [
        '编写刚好通过测试的最小实现',
        '不过度设计，只满足当前测试需求',
        '运行测试确认全部通过',
        '完成后使用 tdd_smart_command("重构") 进入REFACTOR阶段'
      ];
      
      // 阶段转换检查
      if (currentState.currentPhase !== 'RED') {
        plan.warnings.push('⚠️ 建议先进入RED阶段编写测试，再进行实现');
      }
      break;
      
    case 'refactor':
      plan.targetPhase = 'REFACTOR';
      plan.phaseTransition = `${currentState.currentPhase} → REFACTOR`;
      plan.mcpActions = [{ type: 'switchPhase', phase: 'REFACTOR' }];
      plan.agentRecommendation = 'tdd-architect';
      plan.taskDescription = '重构代码质量，保持测试绿色（TDD REFACTOR阶段）';
      plan.filePermissions = {
        allowed: ['src/', 'lib/', 'main/', 'docs/', 'README*'],
        blocked: ['tests/', '*.test.*'] // 保护测试不被修改
      };
      plan.claudeInstructions = generateRefactorPhaseInstructions();
      plan.nextSteps = [
        '改善代码结构和可读性',
        '应用设计模式和最佳实践',
        '优化性能和可维护性',
        '确保所有测试保持绿色',
        '完成后使用 tdd_smart_command("写测试") 开始下一个功能'
      ];
      
      // 阶段转换检查
      if (currentState.currentPhase !== 'GREEN') {
        plan.warnings.push('⚠️ 建议在GREEN阶段（测试通过）后再进行重构');
      }
      break;
      
    case 'test':
      plan.mcpActions = [{ type: 'runTest' }];
      plan.taskDescription = '运行测试验证代码质量';
      plan.claudeInstructions = generateTestInstructions(currentState);
      plan.nextSteps = generateTestNextSteps(currentState);
      break;
      
    case 'status':
      plan.mcpActions = [{ type: 'getStatus' }];
      plan.taskDescription = '查看当前TDD状态信息';
      plan.claudeInstructions = generateStatusInstructions();
      break;
      
    case 'help':
      plan.taskDescription = '显示TDD智能协调帮助';
      plan.claudeInstructions = generateHelpInstructions();
      break;
      
    default:
      plan.taskDescription = '未识别的指令';
      plan.claudeInstructions = generateUnknownIntentResponse(userIntent);
  }
  
  return plan;
}

/**
 * 执行MCP动作列表
 */
async function executeMCPActions(actions, projectRoot) {
  for (const action of actions) {
    try {
      logger.info(`执行MCP动作: ${action.type}`);
      await executeSingleMCPAction(action, projectRoot);
    } catch (error) {
      logger.error(`执行MCP动作失败 ${action.type}:`, error);
      // 继续执行其他动作
    }
  }
}

/**
 * 执行单个MCP动作
 */
async function executeSingleMCPAction(action, projectRoot) {
  switch (action.type) {
    case 'initProject':
      return await initProject({ projectRoot });
    case 'switchPhase':
      return await switchPhase({ projectRoot, phase: action.phase });
    case 'runTest':
      return await runTest({ projectRoot });
    case 'getStatus':
      return await getStatus({ projectRoot });
    default:
      throw new Error(`未知的MCP动作类型: ${action.type}`);
  }
}

/**
 * 格式化Claude执行指令
 * 生成结构化的、可操作的指令给Claude
 */
function formatClaudeInstructions(plan) {
  let instructions = '';
  
  // 标题和基本信息
  instructions += `# ${getPhaseIcon(plan.targetPhase)} TDD智能协调激活\n\n`;
  
  // 主要指令
  if (plan.claudeInstructions) {
    instructions += plan.claudeInstructions + '\n\n';
  }
  
  // 警告信息
  if (plan.warnings?.length > 0) {
    instructions += `**⚠️ 重要提醒**:\n`;
    plan.warnings.forEach(warning => {
      instructions += `- ${warning}\n`;
    });
    instructions += '\n';
  }
  
  // Agent推荐
  if (plan.agentRecommendation) {
    instructions += `> **🤖 请立即切换为 \`${plan.agentRecommendation}\` 身份执行以下任务**\n\n`;
  }
  
  // 任务描述
  if (plan.taskDescription) {
    instructions += `**🎯 核心任务**: ${plan.taskDescription}\n\n`;
  }
  
  // 文件权限说明
  if (plan.filePermissions) {
    instructions += `**📁 文件编辑权限** (由TDD Guard自动强制执行):\n`;
    instructions += `- ✅ **允许编辑**: ${plan.filePermissions.allowed.join(', ')}\n`;
    instructions += `- ❌ **禁止编辑**: ${plan.filePermissions.blocked.join(', ')}\n\n`;
  }
  
  // 执行步骤
  if (plan.nextSteps?.length > 0) {
    instructions += `**📋 执行步骤**:\n`;
    plan.nextSteps.forEach((step, index) => {
      instructions += `${index + 1}. ${step}\n`;
    });
    instructions += '\n';
  }
  
  // 阶段变更信息
  if (plan.phaseTransition) {
    instructions += `**🔄 TDD阶段变更**: ${plan.phaseTransition}\n`;
  }
  
  // 元信息
  instructions += `\n---\n`;
  instructions += `**⚡ TDD智能协调系统** | 意图: ${plan.intent.type} | 置信度: ${(plan.confidence * 100).toFixed(0)}% | 匹配: ${plan.intent.matchType}`;
  
  return instructions;
}

/**
 * 获取阶段图标
 */
function getPhaseIcon(phase) {
  const icons = {
    'READY': '⚪',
    'RED': '🔴', 
    'GREEN': '🟢',
    'REFACTOR': '🔧'
  };
  return icons[phase] || '❓';
}

// =================== 指令生成函数 ===================

function generateInitInstructions(currentState) {
  if (currentState.isInitialized) {
    return `🚀 **TDD项目重新初始化完成**

已刷新Claude Code TDD环境配置：
- ✅ TDD Guard hooks已重新激活
- ✅ 最新的专业agents已同步
- ✅ TDD状态管理已重置
- ✅ 智能命令路由已更新

**环境已就绪，可以开始TDD开发！**`;
  }
  
  return `🚀 **TDD项目初始化完成**

Claude Code TDD环境已成功配置：
- ✅ TDD Guard hooks已激活 - 自动控制文件编辑权限
- ✅ 专业agents已配置 - tdd-architect等专业代理就绪  
- ✅ TDD状态管理已启用 - 智能跟踪开发阶段
- ✅ 智能命令路由已激活 - 支持自然语言操作

**现在可以开始TDD开发流程！**`;
}

function generateRedPhaseInstructions() {
  return `🔴 **TDD RED阶段激活 - 测试驱动开发**

**TDD第一法则**: 在写出能够失败的单元测试之前，不允许写任何产品代码

**当前模式**: 测试先行模式
- 🎯 专注编写会失败的测试用例
- 🎯 明确定义期望的功能行为
- 🎯 遵循AAA模式：Given-When-Then结构
- 🎯 确保测试失败原因是"功能未实现"

**质量要求**:
- 测试用例名称清晰表达意图
- 断言明确，错误信息有意义
- 测试数据准备充分
- 边界条件和异常情况覆盖`;
}

function generateGreenPhaseInstructions() {
  return `🟢 **TDD GREEN阶段激活 - 最小实现**

**TDD第二法则**: 只允许写出刚好能够通过当前失败测试的产品代码

**当前模式**: 最小实现模式
- 🎯 编写刚好通过测试的代码
- 🎯 不过度设计，不实现测试未要求的功能
- 🎯 确保所有测试从红色变为绿色
- 🎯 保持实现简单直接

**实现原则**:
- 最小可行实现，避免过度工程化
- 专注于当前失败的测试用例
- 可以使用硬编码或简单逻辑
- 重构留待REFACTOR阶段`;
}

function generateRefactorPhaseInstructions() {
  return `🔧 **TDD REFACTOR阶段激活 - 代码重构**

**TDD第三法则**: 在保持测试绿色的前提下，持续改善代码质量

**当前模式**: 质量改进模式
- 🎯 重构代码结构，提高可读性
- 🎯 应用设计模式和最佳实践
- 🎯 优化性能，但保持测试通过
- 🎯 消除代码重复和坏味道

**重构重点**:
- 提取方法和类，改善职责分离
- 优化命名，提高代码可读性
- 消除重复代码
- 应用SOLID原则`;
}

function generateTestInstructions(currentState) {
  const phaseGuidance = {
    'RED': '🔴 RED阶段测试 - 验证测试是否正确失败',
    'GREEN': '🟢 GREEN阶段测试 - 验证实现是否通过所有测试',
    'REFACTOR': '🔧 REFACTOR阶段测试 - 确保重构后测试依然通过',
    'READY': '⚪ 环境测试 - 验证项目测试环境配置'
  };
  
  return `🧪 **执行测试验证**

${phaseGuidance[currentState.currentPhase] || '🧪 执行项目测试'}

正在运行项目测试套件，根据当前TDD阶段提供相应建议...`;
}

function generateTestNextSteps(currentState) {
  const stepsByPhase = {
    'RED': [
      '确认测试失败，失败原因应该是"功能未实现"',
      '如果测试通过，说明功能已存在，需要修改测试',
      '测试失败确认后，使用 tdd_smart_command("实现") 进入GREEN阶段'
    ],
    'GREEN': [
      '确认所有测试通过',  
      '如果有测试失败，继续完善实现代码',
      '测试全部通过后，使用 tdd_smart_command("重构") 进入REFACTOR阶段'
    ],
    'REFACTOR': [
      '确保重构后所有测试依然通过',
      '如果测试失败，说明重构破坏了功能，需要修复',
      '测试保持绿色，准备下一个功能: tdd_smart_command("写测试")'
    ]
  };
  
  return stepsByPhase[currentState.currentPhase] || [
    '检查测试执行结果',
    '根据结果调整开发策略'
  ];
}

function generateStatusInstructions() {
  return `📊 **TDD状态查询**

正在获取当前项目的TDD状态信息：
- 当前TDD阶段和历史
- 项目配置和环境状态
- 建议的下一步操作

系统将提供详细的状态报告和操作建议...`;
}

function generateHelpInstructions() {
  return `🎯 **TDD智能协调系统帮助**

**🚀 设计理念**: 
- **MCP**: 负责意图识别、状态管理、执行计划生成
- **Claude**: 负责计划解析、agent切换、任务执行  
- **Hooks**: 负责权限控制、阶段保护、反模式阻断

**📋 智能命令支持**:

**🔧 项目管理**:
- \`tdd_smart_command("初始化")\` - 初始化TDD环境

**🔄 TDD三阶段循环**:
- \`tdd_smart_command("写测试")\` - 进入RED阶段
- \`tdd_smart_command("实现")\` - 进入GREEN阶段
- \`tdd_smart_command("重构")\` - 进入REFACTOR阶段

**🛠️ 工具操作**:
- \`tdd_smart_command("测试")\` - 运行测试
- \`tdd_smart_command("状态")\` - 查看状态

**💬 自然语言示例**:
- "开始写测试" → 自动进入RED阶段，推荐tdd-architect
- "现在实现功能" → 自动进入GREEN阶段，指导最小实现
- "代码需要重构" → 自动进入REFACTOR阶段，保护测试不被修改

**⚡ 智能特性**:
- 🧠 多模式意图识别（精确+模糊匹配）
- 🔒 TDD Guard自动权限控制
- 🤖 智能agent推荐和切换指导
- 📋 基于阶段的执行步骤生成
- ⚠️ 阶段转换合理性检查`;
}

function generateUnknownIntentResponse(userIntent) {
  return `❓ **未识别的指令**: "${userIntent.originalInput}"

**🤖 智能意图识别失败**，请尝试以下命令：

**🚀 项目管理**:
- "初始化" / "配置环境" → 初始化TDD环境

**🔄 TDD三阶段循环**:  
- "写测试" / "测试先行" → 进入RED阶段
- "实现" / "写代码" → 进入GREEN阶段
- "重构" / "优化代码" → 进入REFACTOR阶段

**🔧 工具操作**:
- "测试" / "跑测试" → 运行测试验证
- "状态" / "查看状态" → 获取当前状态
- "帮助" → 显示详细帮助

**💡 自然语言示例**:
- "帮我初始化TDD环境"
- "现在开始写测试" 
- "功能实现完成了"
- "这段代码需要重构"

**⚡ 精确命令**: \`red\`, \`green\`, \`refactor\`, \`test\`, \`status\`, \`init\``;
}

// =================== 占位函数（使用原有实现） ===================

// 这些函数将使用原有core.js中的实现
export async function initProject(args) {
  // 占位 - 使用原有实现
  return formatMCPResponse('initProject - 使用原有实现');
}

export async function switchPhase(args) {
  // 占位 - 使用原有实现  
  return formatMCPResponse('switchPhase - 使用原有实现');
}

export async function runTest(args) {
  // 占位 - 使用原有实现
  return formatMCPResponse('runTest - 使用原有实现');
}

export async function getStatus(args) {
  // 占位 - 使用原有实现
  return formatMCPResponse('getStatus - 使用原有实现');
}

// 主要导出函数
export const routeCommand = smartCommandRouter;