#!/usr/bin/env node
/**
 * tdd_guard.js - 纯TDD守护脚本
 * - PreToolUse：按TDD阶段限制文件编辑权限
 * - UserPromptSubmit：阻止反TDD指令和提醒正确流程
 * 状态文件：.claude/tdd-state.json
 */
const fs = require('fs');
const path = require('path');

function readJSONSafe(file, fallback) {
  try { 
    return JSON.parse(fs.readFileSync(file, 'utf8')); 
  } catch { 
    return fallback; 
  }
}

function writeJSONSafe(file, obj) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  } catch (error) {
    // 静默失败，不影响主流程
  }
}

const input = (() => {
  try { 
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); 
  } catch { 
    return {}; 
  }
})();

const hook = input.hookEventName || input.event || '';
const tddStateFile = '.claude/tdd-state.json';
const tddState = readJSONSafe(tddStateFile, null);

// 从TDD状态文件中获取当前TDD阶段
const currentTDDPhase = tddState?.currentPhase?.toLowerCase() || null;

function respond(obj) { 
  process.stdout.write(JSON.stringify(obj)); 
}

function normalizePath(p) {
  if (!p) return null;
  return p.replace(/^\.\/+/, '').replace(/\\/g, '/');
}

function isAllowedByTDDPhase(tddPhase, file) {
  // 如果没有激活的TDD状态，允许所有操作
  if (!tddPhase) {
    return { allowed: true };
  }

  const allowMap = {
    red:      [/^tests\//, /^spec\//, /.*\.test\.(js|ts|java|py)$/, /.*\.spec\.(js|ts|java|py)$/, /.*Test\.java$/, /^test_.*\.py$/, /^\.claude\//],
    green:    [/^src\//, /^lib\//, /^main\//, /^yichao-/, /^package\.json$/, /^pyproject\.toml$/, /^go\.mod$/, /^Cargo\.toml$/, /^pom\.xml$/, /^\.claude\//],
    refactor: [/^src\//, /^lib\//, /^main\//, /^yichao-/, /^docs\//, /^README/, /^\.claude\//],
    ready:    [/^\.claude\//] // READY阶段只能修改配置文件
  };
  
  const rules = allowMap[tddPhase] || [];
  
  const isAllowed = rules.some(rule => rule.test(file));
  
  if (isAllowed) {
    return { allowed: true };
  }
  
  // 生成友好的错误消息
  const phaseMessages = {
    red: {
      title: '🔴 RED阶段限制',
      description: '当前处于TDD RED阶段，只能编辑测试文件',
      allowed: '允许：tests/, spec/, *.test.*, *.spec.*, *Test.java, test_*.py',
      suggestion: '请编写失败的测试用例，或使用 /tdd:green 切换到GREEN阶段'
    },
    green: {
      title: '🟢 GREEN阶段限制',
      description: '当前处于TDD GREEN阶段，只能编辑生产代码',
      allowed: '允许：src/, lib/, main/, package.json, pom.xml 等',
      suggestion: '请编写最小实现代码，或使用 /tdd:refactor 切换到重构阶段'
    },
    refactor: {
      title: '🔧 REFACTOR阶段限制',
      description: '当前处于TDD REFACTOR阶段，只能重构生产代码和文档',
      allowed: '允许：src/, lib/, docs/, README',
      suggestion: '请改进代码质量，保持测试通过'
    },
    ready: {
      title: '⚪ READY阶段限制',
      description: '当前处于READY阶段，只能修改配置文件',
      allowed: '允许：.claude/ 目录',
      suggestion: '使用 /tdd:red 开始TDD开发流程'
    }
  };
  
  const phaseMsg = phaseMessages[tddPhase] || {
    title: '❓ 未知阶段',
    description: `未知的TDD阶段: ${tddPhase}`,
    allowed: '',
    suggestion: '请使用 /tdd:red 开始TDD开发流程'
  };
  
  return {
    allowed: false,
    title: phaseMsg.title,
    description: phaseMsg.description,
    suggestion: phaseMsg.suggestion,
    allowed_patterns: phaseMsg.allowed
  };
}

function onPreToolUse() {
  const toolName = input.toolName;
  const filePath = normalizePath(input.args?.file_path || input.args?.path);
  
  if (!filePath) return respond({});
  
  // 只检查文件编辑相关的工具
  const editTools = ['Edit', 'Write', 'MultiEdit'];
  if (!editTools.includes(toolName)) {
    return respond({});
  }
  
  const result = isAllowedByTDDPhase(currentTDDPhase, filePath);
  
  if (!result.allowed) {
    return respond({
      decision: 'block',
      reason: `${result.title}\n\n${result.description}\n\n📁 ${result.allowed_patterns}\n\n💡 ${result.suggestion}`
    });
  }
  
  return respond({});
}

function onPrompt() {
  const text = (input.userMessage || input.text || '').toLowerCase();
  if (!text) return respond({});
  
  // TDD反模式检测
  const antiPatterns = [
    /(跳过测试|skip.?test)/,
    /(先实现|implement.?first)/,
    /(直接实现|direct.?implement)/,
    /(忽略测试|ignore.?test)/,
    /(不写测试|no.?test)/,
    /(测试后写|test.?later)/
  ];
  
  for (const pattern of antiPatterns) {
    if (pattern.test(text)) {
      const suggestions = {
        red: '🔴 请先在RED阶段编写失败测试',
        green: '🟢 请在GREEN阶段编写最小实现',
        refactor: '🔧 请在REFACTOR阶段改进代码质量',
      };
      
      const currentSuggestion = suggestions[currentTDDPhase] || '⚪ 请使用 /tdd:red 开始TDD流程';
      
      return respond({ 
        decision: 'block', 
        reason: `🚫 TDD守护：检测到反TDD模式\n\n${currentSuggestion}\n\n📚 TDD三法则：\n1. 只有在失败测试存在时才写生产代码\n2. 只写刚好能失败的测试\n3. 只写刚好能通过测试的生产代码` 
      });
    }
  }
  
  return respond({});
}

// 路由到对应的处理函数
switch (hook) {
  case 'PreToolUse':
    onPreToolUse();
    break;
  case 'UserPromptSubmit':
    onPrompt();
    break;
  default:
    respond({});
}