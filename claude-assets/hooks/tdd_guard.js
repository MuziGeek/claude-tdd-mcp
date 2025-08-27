#!/usr/bin/env node
/**
 * tdd_guard.js - Enhanced with Task Master Integration
 * - PreToolUse：按阶段与 TDD 相位限制写入路径
 * - UserPromptSubmit：阻断"跳过测试/先实现"等反 TDD 指令
 * - Task Master集成：同步TDD状态和任务状态
 * 状态文件：.claude/cache/feature_state.json, .claude/cache/tdd_task_state.json
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readJSONSafe(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJSONSafe(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

const input = (() => {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
})();

const hook = input.hookEventName || input.event || '';
const taskStateFile = '.claude/cache/tdd_task_state.json';
const taskState = readJSONSafe(taskStateFile, null);

// 从Task State中获取当前TDD阶段，如果没有则默认允许所有操作
const currentTDDPhase = taskState?.currentTask?.tddPhase || null;

function respond(obj) { process.stdout.write(JSON.stringify(obj)); }

function normalizePath(p) {
  if (!p) return null;
  return p.replace(/^\.\/+/, '').replace(/\\/g, '/');
}

function isAllowedByTDDPhase(tddPhase, file) {
  // 如果没有激活的TDD任务，允许所有操作
  if (!tddPhase || tddPhase === 'ready') {
    return { allowed: true };
  }

  const allowMap = {
    red:      [/^tests\//, /^\.claude\//, /^\.taskmaster\//],
    green:    [/^src\//, /^yichao-/, /^package\.json$/, /^pyproject\.toml$/, /^go\.mod$/, /^Cargo\.toml$/, /^pom\.xml$/, /^\.claude\//, /^\.taskmaster\//],
    refactor: [/^src\//, /^yichao-/, /^docs\//, /^\.claude\//, /^\.taskmaster\//],
    done:     [/^\.claude\//, /^\.taskmaster\//] // 完成阶段只能修改系统文件
  };
  
  const rules = allowMap[tddPhase] || [];
  
  // Check if file matches allowed patterns
  if (!rules.some(r => r.test(file))) {
    return { 
      allowed: false, 
      reason: `TDD ${tddPhase.toUpperCase()} 阶段不允许修改此类文件: ${file}` 
    };
  }
  
  return { allowed: true };
}

function preToolUse() {
  // 兼容不同工具字段命名
  const ti = input.toolInput || input.tool_input || {};
  const file = normalizePath(ti.file_path || ti.path || ti.file || (Array.isArray(ti.files) ? ti.files[0] : null));
  const deny = (reason) => respond({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
  const allow = (reason) => respond({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: reason || 'ok' } });

  // 没有文件目标：放行（例如仅运行 bash 检查）
  if (!file) return allow('no-target-file');

  // 系统配置文件始终允许
  if (/^\.(claude|taskmaster)\//.test(file)) {
    return allow('system-config-file');
  }

  // TDD阶段限制检查
  const tddCheck = isAllowedByTDDPhase(currentTDDPhase, file);
  if (!tddCheck.allowed) {
    return deny(tddCheck.reason);
  }

  // 记录文件访问到Task Master任务状态
  logFileAccess(file, 'access');
  
  return allow(`stage=${state.stage}, tdd=${state.tdd}`);
}

/**
 * 记录文件访问到Task Master任务状态
 */
function logFileAccess(filePath, operation) {
  try {
    if (!taskState || !taskState.currentTask) return;
    
    const timestamp = new Date().toISOString();
    const access = {
      file: filePath,
      operation: operation,
      timestamp: timestamp,
      phase: state.tdd || 'unknown'
    };
    
    // 初始化访问历史
    if (!taskState.currentTask.fileAccess) {
      taskState.currentTask.fileAccess = [];
    }
    
    // 避免重复记录相同文件的连续访问
    const lastAccess = taskState.currentTask.fileAccess[taskState.currentTask.fileAccess.length - 1];
    if (!lastAccess || lastAccess.file !== filePath || Date.now() - new Date(lastAccess.timestamp).getTime() > 1000) {
      taskState.currentTask.fileAccess.push(access);
      
      // 限制历史记录数量
      if (taskState.currentTask.fileAccess.length > 50) {
        taskState.currentTask.fileAccess = taskState.currentTask.fileAccess.slice(-30);
      }
      
      // 保存更新后的任务状态
      writeJSONSafe(taskStateFile, taskState);
    }
  } catch (error) {
    // 静默失败，不影响主流程
  }
}

function onPrompt() {
  const text = (input.userMessage || input.text || '').toLowerCase();
  if (!text) return respond({});
  
  // TDD反模式检测
  if (/(跳过测试|先实现|直接实现|忽略测试|skip.?test|implement.?first|no.?test)/.test(text)) {
    return respond({ decision: 'block', reason: 'TDD 策略：请先编写失败测试（RED）再实现。' });
  }
  
  // Task Master集成命令检测
  if (/(\/tm:|task-master|taskmaster)/.test(text)) {
    logTaskMasterCommand(text);
  }
  
  return respond({});
}

/**
 * 记录Task Master命令使用
 */
function logTaskMasterCommand(text) {
  try {
    if (!taskState || !taskState.currentTask) return;
    
    const timestamp = new Date().toISOString();
    const command = {
      text: text.substring(0, 100), // 限制长度
      timestamp: timestamp,
      phase: currentTDDPhase || 'unknown'
    };
    
    // 初始化命令历史
    if (!taskState.currentTask.commandHistory) {
      taskState.currentTask.commandHistory = [];
    }
    
    taskState.currentTask.commandHistory.push(command);
    
    // 限制历史记录数量
    if (taskState.currentTask.commandHistory.length > 20) {
      taskState.currentTask.commandHistory = taskState.currentTask.commandHistory.slice(-10);
    }
    
    // 保存更新
    writeJSONSafe(taskStateFile, taskState);
  } catch (error) {
    // 静默失败
  }
}

if (hook === 'PreToolUse') preToolUse();
else if (hook === 'UserPromptSubmit') onPrompt();
else respond({});