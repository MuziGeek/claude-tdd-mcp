#!/usr/bin/env node

/**
 * TDD-Task Master Sync Hook
 * 在文件编辑前后同步TDD状态与Task Master任务状态
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
    FEATURE_STATE_FILE: '.claude/cache/feature_state.json',
    TDD_TASK_STATE_FILE: '.claude/cache/tdd_task_state.json',
    PROJECT_ROOT: process.cwd()
};

class TDDTaskSyncHook {
    constructor() {
        this.projectRoot = CONFIG.PROJECT_ROOT;
    }

    /**
     * 读取当前TDD状态
     */
    getCurrentTDDState() {
        try {
            const featureStatePath = path.join(this.projectRoot, CONFIG.FEATURE_STATE_FILE);
            if (fs.existsSync(featureStatePath)) {
                return JSON.parse(fs.readFileSync(featureStatePath, 'utf8'));
            }
            return null;
        } catch (error) {
            console.error('读取TDD状态失败:', error.message);
            return null;
        }
    }

    /**
     * 读取TDD任务状态
     */
    getTDDTaskState() {
        try {
            const taskStatePath = path.join(this.projectRoot, CONFIG.TDD_TASK_STATE_FILE);
            if (fs.existsSync(taskStatePath)) {
                return JSON.parse(fs.readFileSync(taskStatePath, 'utf8'));
            }
            return null;
        } catch (error) {
            console.error('读取TDD任务状态失败:', error.message);
            return null;
        }
    }

    /**
     * 检查文件是否被TDD规则限制
     */
    checkTDDRestrictions(filePath, tddState) {
        if (!tddState || !tddState.tdd) {
            return { allowed: true, reason: null };
        }

        const phase = tddState.tdd;
        const relativePath = path.relative(this.projectRoot, filePath);

        // 定义每个阶段允许修改的文件路径
        const phaseRestrictions = {
            'design': {
                allowed: ['docs/', 'tests/specs/'],
                denied: ['src/', 'yichao-', 'tests/unit/', 'tests/integration/']
            },
            'red': {
                allowed: ['tests/'],
                denied: ['src/', 'yichao-']
            },
            'green': {
                allowed: ['src/', 'yichao-'],
                denied: ['tests/']
            },
            'refactor': {
                allowed: ['src/', 'yichao-', 'docs/'],
                denied: []  // REFACTOR阶段相对宽松，但仍需保持测试通过
            }
        };

        const restrictions = phaseRestrictions[phase];
        if (!restrictions) {
            return { allowed: true, reason: null };
        }

        // 检查是否在拒绝列表中
        for (const denied of restrictions.denied) {
            if (relativePath.startsWith(denied)) {
                return {
                    allowed: false,
                    reason: `TDD ${phase.toUpperCase()} 阶段不允许修改 ${denied} 路径的文件`
                };
            }
        }

        // 检查是否在允许列表中
        for (const allowed of restrictions.allowed) {
            if (relativePath.startsWith(allowed)) {
                return { allowed: true, reason: null };
            }
        }

        // 如果不在明确的允许列表中，默认拒绝
        return {
            allowed: false,
            reason: `TDD ${phase.toUpperCase()} 阶段只允许修改: ${restrictions.allowed.join(', ')}`
        };
    }

    /**
     * 同步Task Master任务状态
     */
    async syncTaskStatus(taskId, tddPhase) {
        try {
            const statusMap = {
                'design': 'in-progress',
                'red': 'in-progress',
                'green': 'in-progress',
                'refactor': 'review',
                'done': 'done'
            };

            const taskStatus = statusMap[tddPhase];
            if (!taskStatus || !taskId) return;

            // 使用Task Master MCP工具同步状态
            const command = `task-master set-status --id="${taskId}" --status="${taskStatus}" --project-root="${this.projectRoot}"`;
            
            // 异步执行，不阻塞主流程
            setTimeout(() => {
                try {
                    execSync(command, { stdio: 'ignore' });
                    console.log(`✅ 任务状态已同步: ${taskId} -> ${taskStatus}`);
                } catch (error) {
                    console.warn(`⚠️  任务状态同步失败: ${error.message}`);
                }
            }, 100);

        } catch (error) {
            console.warn('同步任务状态时出错:', error.message);
        }
    }

    /**
     * 更新文件修改记录到任务状态
     */
    updateTaskFileHistory(filePath, operation) {
        try {
            const taskState = this.getTDDTaskState();
            if (!taskState || !taskState.currentTask) return;

            const relativePath = path.relative(this.projectRoot, filePath);
            const timestamp = new Date().toISOString();

            // 更新文件历史
            if (!taskState.currentTask.fileHistory) {
                taskState.currentTask.fileHistory = [];
            }

            taskState.currentTask.fileHistory.push({
                file: relativePath,
                operation: operation,
                timestamp: timestamp,
                phase: taskState.currentTask.tddPhase
            });

            // 更新测试文件列表
            if (relativePath.startsWith('tests/') && operation === 'modified') {
                if (!taskState.currentTask.testFiles.includes(relativePath)) {
                    taskState.currentTask.testFiles.push(relativePath);
                }
            }

            // 保存更新后的状态
            const taskStatePath = path.join(this.projectRoot, CONFIG.TDD_TASK_STATE_FILE);
            fs.writeFileSync(taskStatePath, JSON.stringify(taskState, null, 2));

        } catch (error) {
            console.warn('更新任务文件历史失败:', error.message);
        }
    }

    /**
     * 预处理钩子 - 在文件编辑前执行
     */
    preEdit(args) {
        const filePath = args[0] || '';
        if (!filePath) return;

        const tddState = this.getCurrentTDDState();
        if (!tddState) return;

        // 检查TDD限制
        const restriction = this.checkTDDRestrictions(filePath, tddState);
        if (!restriction.allowed) {
            console.error(`❌ TDD限制: ${restriction.reason}`);
            console.error(`当前阶段: ${tddState.tdd?.toUpperCase() || 'UNKNOWN'}`);
            console.error(`尝试修改: ${path.relative(this.projectRoot, filePath)}`);
            process.exit(1);
        }

        // 记录文件将被修改
        this.updateTaskFileHistory(filePath, 'will_modify');
    }

    /**
     * 后处理钩子 - 在文件编辑后执行
     */
    postEdit(args) {
        const filePath = args[0] || '';
        if (!filePath) return;

        const tddState = this.getCurrentTDDState();
        const taskState = this.getTDDTaskState();

        // 记录文件已被修改
        this.updateTaskFileHistory(filePath, 'modified');

        // 如果有当前任务，同步状态
        if (taskState && taskState.currentTask) {
            this.syncTaskStatus(taskState.currentTask.id, taskState.currentTask.tddPhase);
        }

        // 输出状态信息
        if (tddState && tddState.tdd) {
            const relativePath = path.relative(this.projectRoot, filePath);
            console.log(`✏️  [${tddState.tdd.toUpperCase()}] 已修改: ${relativePath}`);
        }
    }

    /**
     * 检查测试状态并更新任务指标
     */
    updateTestMetrics() {
        try {
            const taskState = this.getTDDTaskState();
            if (!taskState || !taskState.currentTask) return;

            // 异步运行测试并更新指标
            setTimeout(() => {
                try {
                    // 运行测试（静默模式）
                    const testResult = execSync(
                        '/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test -q',
                        { 
                            cwd: this.projectRoot,
                            encoding: 'utf8'
                        }
                    );

                    // 解析测试结果
                    const metrics = this.parseTestResults(testResult);
                    
                    // 更新任务指标
                    taskState.currentTask.metrics = {
                        ...taskState.currentTask.metrics,
                        ...metrics,
                        lastUpdate: new Date().toISOString()
                    };

                    // 保存更新
                    const taskStatePath = path.join(this.projectRoot, CONFIG.TDD_TASK_STATE_FILE);
                    fs.writeFileSync(taskStatePath, JSON.stringify(taskState, null, 2));

                } catch (error) {
                    console.warn('更新测试指标失败:', error.message);
                }
            }, 500);

        } catch (error) {
            console.warn('检查测试状态失败:', error.message);
        }
    }

    /**
     * 解析测试结果
     */
    parseTestResults(testOutput) {
        try {
            const metrics = {
                testsRun: 0,
                testsPassing: 0,
                testsFailing: 0,
                coverage: 0
            };

            // 简单的测试结果解析（可以根据实际输出格式调整）
            const testRegex = /Tests run: (\d+), Failures: (\d+), Errors: (\d+)/;
            const match = testOutput.match(testRegex);
            
            if (match) {
                const testsRun = parseInt(match[1]);
                const failures = parseInt(match[2]);
                const errors = parseInt(match[3]);
                
                metrics.testsRun = testsRun;
                metrics.testsPassing = testsRun - failures - errors;
                metrics.testsFailing = failures + errors;
            }

            return metrics;
        } catch (error) {
            console.warn('解析测试结果失败:', error.message);
            return {};
        }
    }
}

// 主函数
function main() {
    const hook = new TDDTaskSyncHook();
    const hookType = process.env.CLAUDE_HOOK_TYPE || process.argv[2];
    const args = process.argv.slice(3);

    try {
        switch (hookType) {
            case 'pre':
            case 'PreToolUse':
                hook.preEdit(args);
                break;
                
            case 'post':
            case 'PostToolUse':
                hook.postEdit(args);
                hook.updateTestMetrics();
                break;
                
            default:
                console.log('TDD-Task Master Sync Hook');
                console.log('用法: node tdd-task-sync.js [pre|post] [file-path]');
                break;
        }
    } catch (error) {
        console.error('Hook执行失败:', error.message);
        if (hookType === 'pre' || hookType === 'PreToolUse') {
            process.exit(1); // pre-hook失败时阻止操作
        }
    }
}

// 如果直接运行
if (require.main === module) {
    main();
}

module.exports = TDDTaskSyncHook;