import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AutoTestRunner');

/**
 * 自动测试运行器
 * 支持文件变更监听、智能测试运行和阶段推进建议
 */
class AutoTestRunner {
  constructor(sessionManager, phaseManager) {
    this.sessionManager = sessionManager;
    this.phaseManager = phaseManager;
    this.watchers = new Map(); // 存储文件监听器
    this.testCache = new Map(); // 缓存测试结果
    this.runningTests = new Set(); // 正在运行的测试
  }

  /**
   * 启动文件监听
   */
  async startWatching(projectRoot) {
    logger.info(`🔍 启动文件监听: ${projectRoot}`);
    
    try {
      // 停止已有的监听器
      await this.stopWatching(projectRoot);
      
      // 检测项目类型和测试配置
      const projectInfo = await this.detectProjectInfo(projectRoot);
      
      // 创建文件系统监听器
      const watcher = this.createFileWatcher(projectRoot, projectInfo);
      
      // 保存监听器引用
      this.watchers.set(projectRoot, {
        watcher,
        projectInfo,
        lastTestRun: null,
        testHistory: []
      });
      
      logger.info(`✅ 文件监听启动成功: ${projectInfo.type}`);
      
      return {
        success: true,
        projectType: projectInfo.type,
        testFramework: projectInfo.testFramework,
        watchedPaths: projectInfo.watchPaths
      };
      
    } catch (error) {
      logger.error('启动文件监听失败:', error);
      throw error;
    }
  }

  /**
   * 停止文件监听
   */
  async stopWatching(projectRoot) {
    logger.info(`⏹️ 停止文件监听: ${projectRoot}`);
    
    const watcherInfo = this.watchers.get(projectRoot);
    if (watcherInfo) {
      if (watcherInfo.watcher) {
        await watcherInfo.watcher.close();
      }
      this.watchers.delete(projectRoot);
    }
  }

  /**
   * 检测项目信息
   */
  async detectProjectInfo(projectRoot) {
    logger.info(`🔬 检测项目信息: ${projectRoot}`);
    
    const projectInfo = {
      type: 'unknown',
      testFramework: 'unknown',
      testCommand: null,
      testPaths: [],
      sourcePaths: [],
      watchPaths: [],
      configFiles: []
    };

    // 检测Java项目
    if (await fs.pathExists(path.join(projectRoot, 'pom.xml'))) {
      projectInfo.type = 'java-maven';
      projectInfo.testFramework = 'junit';
      projectInfo.testCommand = 'mvn test';
      projectInfo.testPaths = ['src/test/java/**/*.java'];
      projectInfo.sourcePaths = ['src/main/java/**/*.java'];
      projectInfo.watchPaths = ['src/**/*.java'];
      projectInfo.configFiles = ['pom.xml'];
    }
    // 检测Gradle Java项目
    else if (await fs.pathExists(path.join(projectRoot, 'build.gradle')) || 
             await fs.pathExists(path.join(projectRoot, 'build.gradle.kts'))) {
      projectInfo.type = 'java-gradle';
      projectInfo.testFramework = 'junit';
      projectInfo.testCommand = './gradlew test';
      projectInfo.testPaths = ['src/test/java/**/*.java'];
      projectInfo.sourcePaths = ['src/main/java/**/*.java'];
      projectInfo.watchPaths = ['src/**/*.java'];
      projectInfo.configFiles = ['build.gradle', 'build.gradle.kts'];
    }
    // 检测Node.js项目
    else if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
      const packageJson = await fs.readJson(path.join(projectRoot, 'package.json'));
      projectInfo.type = 'nodejs';
      
      // 检测测试框架
      if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
        projectInfo.testFramework = 'jest';
        projectInfo.testCommand = 'npm test';
      } else if (packageJson.devDependencies?.mocha || packageJson.dependencies?.mocha) {
        projectInfo.testFramework = 'mocha';
        projectInfo.testCommand = 'npm test';
      }
      
      projectInfo.testPaths = ['test/**/*.js', 'tests/**/*.js', '**/*.test.js', '**/*.spec.js'];
      projectInfo.sourcePaths = ['src/**/*.js', 'lib/**/*.js'];
      projectInfo.watchPaths = ['src/**/*.js', 'lib/**/*.js', 'test/**/*.js', 'tests/**/*.js'];
      projectInfo.configFiles = ['package.json'];
    }
    // 检测Python项目
    else if (await fs.pathExists(path.join(projectRoot, 'requirements.txt')) ||
             await fs.pathExists(path.join(projectRoot, 'setup.py')) ||
             await fs.pathExists(path.join(projectRoot, 'pyproject.toml'))) {
      projectInfo.type = 'python';
      projectInfo.testFramework = 'pytest';
      projectInfo.testCommand = 'python -m pytest';
      projectInfo.testPaths = ['tests/**/*.py', 'test/**/*.py', '**/*_test.py', '**/test_*.py'];
      projectInfo.sourcePaths = ['src/**/*.py', '**/*.py'];
      projectInfo.watchPaths = ['**/*.py'];
      projectInfo.configFiles = ['requirements.txt', 'setup.py', 'pyproject.toml'];
    }

    logger.info(`📋 项目信息: ${projectInfo.type} (${projectInfo.testFramework})`);
    return projectInfo;
  }

  /**
   * 创建文件监听器
   */
  createFileWatcher(projectRoot, projectInfo) {
    const watcher = chokidar.watch(projectInfo.watchPaths, {
      cwd: projectRoot,
      persistent: true,
      ignoreInitial: true,
      ignored: [
        '**/node_modules/**',
        '**/target/**',
        '**/build/**',
        '**/.git/**',
        '**/coverage/**',
        '**/*.class'
      ]
    });

    // 文件变更事件处理
    watcher.on('change', async (filePath) => {
      await this.handleFileChange(projectRoot, filePath, projectInfo);
    });

    watcher.on('add', async (filePath) => {
      await this.handleFileChange(projectRoot, filePath, projectInfo);
    });

    watcher.on('error', (error) => {
      logger.error('文件监听错误:', error);
    });

    return watcher;
  }

  /**
   * 处理文件变更
   */
  async handleFileChange(projectRoot, filePath, projectInfo) {
    logger.info(`📁 文件变更: ${filePath}`);
    
    try {
      // 获取当前TDD状态
      const state = await this.phaseManager.getCurrentState(projectRoot);
      const currentPhase = state.state?.phase;
      
      if (!currentPhase) {
        logger.info('没有活动的TDD阶段，跳过自动测试');
        return;
      }

      // 防抖处理：延迟执行测试
      const watcherInfo = this.watchers.get(projectRoot);
      if (watcherInfo.debounceTimer) {
        clearTimeout(watcherInfo.debounceTimer);
      }

      watcherInfo.debounceTimer = setTimeout(async () => {
        await this.executeAutoTest(projectRoot, filePath, currentPhase, projectInfo);
      }, 2000); // 2秒防抖

    } catch (error) {
      logger.error('处理文件变更失败:', error);
    }
  }

  /**
   * 执行自动测试
   */
  async executeAutoTest(projectRoot, changedFile, currentPhase, projectInfo) {
    logger.info(`🧪 执行自动测试: ${currentPhase} 阶段`);
    
    try {
      // 避免重复运行
      if (this.runningTests.has(projectRoot)) {
        logger.info('测试正在运行中，跳过本次执行');
        return;
      }

      this.runningTests.add(projectRoot);

      // 运行测试
      const testResult = await this.runTests(projectRoot, projectInfo);
      
      // 分析测试结果并提供建议
      const suggestion = await this.analyzeTestResults(
        projectRoot, 
        currentPhase, 
        testResult, 
        changedFile
      );

      // 缓存结果
      this.testCache.set(projectRoot, {
        timestamp: new Date().toISOString(),
        phase: currentPhase,
        result: testResult,
        suggestion,
        changedFile
      });

      // 记录测试历史
      const watcherInfo = this.watchers.get(projectRoot);
      if (watcherInfo) {
        watcherInfo.testHistory.push({
          timestamp: new Date().toISOString(),
          phase: currentPhase,
          passed: testResult.success,
          changedFile
        });

        // 只保留最近20次记录
        if (watcherInfo.testHistory.length > 20) {
          watcherInfo.testHistory.shift();
        }
      }

      logger.info(`✅ 自动测试完成: ${testResult.success ? '通过' : '失败'}`);

    } catch (error) {
      logger.error('执行自动测试失败:', error);
    } finally {
      this.runningTests.delete(projectRoot);
    }
  }

  /**
   * 运行测试
   */
  async runTests(projectRoot, projectInfo) {
    logger.info(`▶️ 运行测试命令: ${projectInfo.testCommand}`);
    
    return new Promise((resolve) => {
      const [command, ...args] = projectInfo.testCommand.split(' ');
      
      const testProcess = spawn(command, args, {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      testProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      testProcess.on('close', (code) => {
        const success = code === 0;
        
        resolve({
          success,
          exitCode: code,
          stdout,
          stderr,
          summary: this.parseTestOutput(stdout, stderr, projectInfo.testFramework)
        });
      });

      testProcess.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          stdout,
          stderr
        });
      });

      // 超时处理
      setTimeout(() => {
        testProcess.kill();
        resolve({
          success: false,
          timeout: true,
          message: '测试执行超时'
        });
      }, 120000); // 2分钟超时
    });
  }

  /**
   * 解析测试输出
   */
  parseTestOutput(stdout, stderr, testFramework) {
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: '0s'
    };

    try {
      switch (testFramework) {
        case 'junit':
          // 解析Maven/Gradle JUnit输出
          const junitMatch = stdout.match(/Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)/);
          if (junitMatch) {
            summary.total = parseInt(junitMatch[1]);
            summary.failed = parseInt(junitMatch[2]) + parseInt(junitMatch[3]);
            summary.skipped = parseInt(junitMatch[4]);
            summary.passed = summary.total - summary.failed - summary.skipped;
          }
          break;
          
        case 'jest':
          // 解析Jest输出
          const jestMatch = stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
          if (jestMatch) {
            summary.failed = parseInt(jestMatch[1]);
            summary.passed = parseInt(jestMatch[2]);
            summary.total = parseInt(jestMatch[3]);
          }
          break;
          
        case 'pytest':
          // 解析pytest输出
          const pytestMatch = stdout.match(/=+ (\d+) failed,? (\d+) passed/);
          if (pytestMatch) {
            summary.failed = parseInt(pytestMatch[1]);
            summary.passed = parseInt(pytestMatch[2]);
            summary.total = summary.failed + summary.passed;
          }
          break;
      }
    } catch (error) {
      logger.warn('解析测试输出失败:', error);
    }

    return summary;
  }

  /**
   * 分析测试结果并提供建议
   */
  async analyzeTestResults(projectRoot, currentPhase, testResult, changedFile) {
    logger.info(`🧠 分析测试结果: ${currentPhase} 阶段`);
    
    const suggestions = {
      phase: currentPhase,
      canProgress: false,
      nextPhase: null,
      actions: [],
      warnings: []
    };

    try {
      switch (currentPhase) {
        case 'RED':
          if (testResult.success) {
            suggestions.warnings.push('⚠️ RED阶段测试应该失败！请检查测试是否正确编写');
            suggestions.actions.push('确保测试覆盖了待实现的功能');
            suggestions.actions.push('验证测试确实会因为缺少实现而失败');
          } else {
            suggestions.canProgress = true;
            suggestions.nextPhase = 'GREEN';
            suggestions.actions.push('✅ 测试失败符合RED阶段要求');
            suggestions.actions.push('现在可以切换到GREEN阶段编写实现代码');
          }
          break;
          
        case 'GREEN':
          if (testResult.success) {
            suggestions.canProgress = true;
            suggestions.nextPhase = 'REFACTOR';
            suggestions.actions.push('✅ 测试通过！最小实现完成');
            suggestions.actions.push('可以切换到REFACTOR阶段改进代码质量');
          } else {
            suggestions.actions.push('❌ 测试仍然失败，继续完善实现代码');
            suggestions.actions.push('专注于让测试通过，不要过度设计');
          }
          break;
          
        case 'REFACTOR':
          if (testResult.success) {
            suggestions.actions.push('✅ 测试保持通过，重构安全');
            suggestions.actions.push('可以继续优化代码或开始新的TDD循环');
          } else {
            suggestions.warnings.push('⚠️ 重构破坏了测试！需要修复');
            suggestions.actions.push('回滚重构或修复破坏的功能');
            suggestions.actions.push('确保重构后所有测试都通过');
          }
          break;
      }

      // 添加通用建议
      if (testResult.summary) {
        const { total, passed, failed } = testResult.summary;
        suggestions.testSummary = `测试概况: ${passed}/${total} 通过, ${failed} 失败`;
        
        if (failed > 0) {
          suggestions.actions.push(`需要修复 ${failed} 个失败测试`);
        }
      }

    } catch (error) {
      logger.error('分析测试结果失败:', error);
    }

    return suggestions;
  }

  /**
   * 获取测试历史
   */
  getTestHistory(projectRoot) {
    const watcherInfo = this.watchers.get(projectRoot);
    return watcherInfo?.testHistory || [];
  }

  /**
   * 获取最近的测试结果
   */
  getLastTestResult(projectRoot) {
    return this.testCache.get(projectRoot) || null;
  }

  /**
   * 手动触发测试
   */
  async triggerTests(projectRoot) {
    logger.info(`🔄 手动触发测试: ${projectRoot}`);
    
    const watcherInfo = this.watchers.get(projectRoot);
    if (!watcherInfo) {
      throw new Error('项目未启动文件监听');
    }

    const state = await this.phaseManager.getCurrentState(projectRoot);
    const currentPhase = state.state?.phase;
    
    if (!currentPhase) {
      throw new Error('没有活动的TDD阶段');
    }

    return await this.executeAutoTest(
      projectRoot, 
      'manual-trigger', 
      currentPhase, 
      watcherInfo.projectInfo
    );
  }

  /**
   * 清理资源
   */
  async cleanup() {
    logger.info('🧹 清理自动测试运行器资源');
    
    for (const [projectRoot] of this.watchers) {
      await this.stopWatching(projectRoot);
    }
    
    this.testCache.clear();
    this.runningTests.clear();
  }
}

export { AutoTestRunner };