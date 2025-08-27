import fs from 'fs-extra';
import path from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('StatusManager');

/**
 * TDD状态管理器
 * 提供实时状态展示、上下文相关提示和进度跟踪
 */
class TDDStatusManager {
  constructor(sessionManager, phaseManager) {
    this.sessionManager = sessionManager;
    this.phaseManager = phaseManager;
    this.statusCache = new Map(); // 缓存状态信息
    this.progressTrackers = new Map(); // 进度跟踪器
  }

  /**
   * 获取增强的TDD状态信息
   */
  async getEnhancedStatus(projectRoot) {
    logger.info(`📊 获取增强TDD状态: ${projectRoot}`);
    
    try {
      // 获取基础状态
      const baseStatus = await this.phaseManager.getCurrentState(projectRoot);
      
      // 获取项目信息
      const projectInfo = await this.getProjectInfo(projectRoot);
      
      // 获取进度信息
      const progressInfo = await this.getProgressInfo(projectRoot);
      
      // 获取上下文提示
      const contextualTips = await this.getContextualTips(
        baseStatus.state, 
        projectInfo, 
        progressInfo
      );
      
      // 获取下一步建议
      const nextSteps = await this.getNextSteps(baseStatus.state, progressInfo);
      
      // 构建增强状态
      const enhancedStatus = {
        ...baseStatus,
        projectInfo,
        progressInfo,
        contextualTips,
        nextSteps,
        statusLine: this.generateStatusLine(baseStatus.state, progressInfo),
        health: this.assessProjectHealth(projectInfo, progressInfo),
        timestamp: new Date().toISOString()
      };
      
      // 缓存状态
      this.statusCache.set(projectRoot, enhancedStatus);
      
      logger.info(`✅ 增强状态获取成功: ${enhancedStatus.state.phase || 'N/A'}阶段`);
      
      return enhancedStatus;
      
    } catch (error) {
      logger.error('获取增强状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取项目基础信息
   */
  async getProjectInfo(projectRoot) {
    logger.info(`🔍 获取项目信息: ${projectRoot}`);
    
    const projectInfo = {
      type: 'unknown',
      language: 'unknown',
      testFramework: 'unknown',
      buildTool: 'unknown',
      structure: {},
      dependencies: [],
      hasTests: false,
      testCoverage: null
    };

    try {
      // 检测Java Maven项目
      if (await fs.pathExists(path.join(projectRoot, 'pom.xml'))) {
        projectInfo.type = 'java';
        projectInfo.language = 'java';
        projectInfo.buildTool = 'maven';
        projectInfo.testFramework = 'junit';
        
        // 检查测试目录
        const testDir = path.join(projectRoot, 'src/test/java');
        projectInfo.hasTests = await fs.pathExists(testDir);
        
        // 统计源码结构
        projectInfo.structure = await this.analyzeJavaStructure(projectRoot);
      }
      // 检测Java Gradle项目
      else if (await fs.pathExists(path.join(projectRoot, 'build.gradle')) ||
               await fs.pathExists(path.join(projectRoot, 'build.gradle.kts'))) {
        projectInfo.type = 'java';
        projectInfo.language = 'java';
        projectInfo.buildTool = 'gradle';
        projectInfo.testFramework = 'junit';
        
        const testDir = path.join(projectRoot, 'src/test/java');
        projectInfo.hasTests = await fs.pathExists(testDir);
        
        projectInfo.structure = await this.analyzeJavaStructure(projectRoot);
      }
      // 检测Node.js项目
      else if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
        const packageJson = await fs.readJson(path.join(projectRoot, 'package.json'));
        
        projectInfo.type = 'nodejs';
        projectInfo.language = 'javascript';
        projectInfo.buildTool = 'npm';
        
        // 检测测试框架
        if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
          projectInfo.testFramework = 'jest';
        } else if (packageJson.devDependencies?.mocha || packageJson.dependencies?.mocha) {
          projectInfo.testFramework = 'mocha';
        }
        
        // 检查是否有测试
        const testDirs = ['test', 'tests', '__tests__'];
        for (const testDir of testDirs) {
          if (await fs.pathExists(path.join(projectRoot, testDir))) {
            projectInfo.hasTests = true;
            break;
          }
        }
        
        projectInfo.structure = await this.analyzeNodeStructure(projectRoot);
        projectInfo.dependencies = Object.keys(packageJson.dependencies || {});
      }
      // 检测Python项目
      else if (await fs.pathExists(path.join(projectRoot, 'requirements.txt')) ||
               await fs.pathExists(path.join(projectRoot, 'setup.py'))) {
        projectInfo.type = 'python';
        projectInfo.language = 'python';
        projectInfo.buildTool = 'pip';
        projectInfo.testFramework = 'pytest';
        
        const testDirs = ['tests', 'test'];
        for (const testDir of testDirs) {
          if (await fs.pathExists(path.join(projectRoot, testDir))) {
            projectInfo.hasTests = true;
            break;
          }
        }
        
        projectInfo.structure = await this.analyzePythonStructure(projectRoot);
      }

      logger.info(`📋 项目信息: ${projectInfo.type} (${projectInfo.testFramework})`);
      
    } catch (error) {
      logger.warn('项目信息获取部分失败:', error.message);
    }

    return projectInfo;
  }

  /**
   * 分析Java项目结构
   */
  async analyzeJavaStructure(projectRoot) {
    const structure = {
      sourceFiles: 0,
      testFiles: 0,
      packages: new Set(),
      classes: new Set()
    };

    try {
      const srcDir = path.join(projectRoot, 'src/main/java');
      const testDir = path.join(projectRoot, 'src/test/java');

      if (await fs.pathExists(srcDir)) {
        structure.sourceFiles = await this.countFiles(srcDir, '**/*.java');
      }

      if (await fs.pathExists(testDir)) {
        structure.testFiles = await this.countFiles(testDir, '**/*.java');
      }
    } catch (error) {
      logger.warn('Java项目结构分析失败:', error.message);
    }

    return {
      sourceFiles: structure.sourceFiles,
      testFiles: structure.testFiles,
      packages: structure.packages.size,
      testCoverage: structure.testFiles > 0 ? 
        Math.round((structure.testFiles / (structure.sourceFiles + structure.testFiles)) * 100) : 0
    };
  }

  /**
   * 分析Node.js项目结构
   */
  async analyzeNodeStructure(projectRoot) {
    const structure = {
      sourceFiles: 0,
      testFiles: 0,
      modules: 0
    };

    try {
      const srcPaths = ['src', 'lib', 'index.js', 'app.js'];
      const testPaths = ['test', 'tests', '__tests__'];

      for (const srcPath of srcPaths) {
        const fullPath = path.join(projectRoot, srcPath);
        if (await fs.pathExists(fullPath)) {
          const stat = await fs.stat(fullPath);
          if (stat.isFile()) {
            structure.sourceFiles += 1;
          } else {
            structure.sourceFiles += await this.countFiles(fullPath, '**/*.js');
          }
        }
      }

      for (const testPath of testPaths) {
        const fullPath = path.join(projectRoot, testPath);
        if (await fs.pathExists(fullPath)) {
          structure.testFiles += await this.countFiles(fullPath, '**/*.{js,ts}');
        }
      }
    } catch (error) {
      logger.warn('Node.js项目结构分析失败:', error.message);
    }

    return {
      sourceFiles: structure.sourceFiles,
      testFiles: structure.testFiles,
      testCoverage: structure.testFiles > 0 ? 
        Math.round((structure.testFiles / (structure.sourceFiles + structure.testFiles)) * 100) : 0
    };
  }

  /**
   * 分析Python项目结构
   */
  async analyzePythonStructure(projectRoot) {
    const structure = {
      sourceFiles: 0,
      testFiles: 0
    };

    try {
      structure.sourceFiles = await this.countFiles(projectRoot, '**/*.py', ['tests', 'test']);
      
      const testPaths = ['tests', 'test'];
      for (const testPath of testPaths) {
        const fullPath = path.join(projectRoot, testPath);
        if (await fs.pathExists(fullPath)) {
          structure.testFiles += await this.countFiles(fullPath, '**/*.py');
        }
      }
    } catch (error) {
      logger.warn('Python项目结构分析失败:', error.message);
    }

    return {
      sourceFiles: structure.sourceFiles,
      testFiles: structure.testFiles,
      testCoverage: structure.testFiles > 0 ? 
        Math.round((structure.testFiles / (structure.sourceFiles + structure.testFiles)) * 100) : 0
    };
  }

  /**
   * 统计文件数量
   */
  async countFiles(dirPath, pattern, excludeDirs = []) {
    try {
      const glob = await import('glob');
      const files = glob.globSync(pattern, { 
        cwd: dirPath,
        ignore: excludeDirs.map(dir => `${dir}/**`)
      });
      return files.length;
    } catch (error) {
      logger.warn(`文件统计失败 ${dirPath}:`, error.message);
      return 0;
    }
  }

  /**
   * 获取进度信息
   */
  async getProgressInfo(projectRoot) {
    logger.info(`📈 获取进度信息: ${projectRoot}`);
    
    const progressInfo = {
      currentCycle: 0,
      totalCycles: 0,
      phaseHistory: [],
      timeSpent: {},
      efficiency: 0,
      velocity: 0
    };

    try {
      const session = await this.sessionManager.getOrCreateSession(projectRoot);
      const tddHistory = session.tddState?.history || [];
      
      // 分析TDD循环历史
      progressInfo.phaseHistory = tddHistory.map(entry => ({
        phase: entry.phase,
        startedAt: entry.startedAt,
        feature: entry.feature,
        duration: this.calculateDuration(entry.startedAt, entry.completedAt)
      }));

      // 计算当前循环数
      const redPhases = tddHistory.filter(h => h.phase === 'RED');
      progressInfo.currentCycle = redPhases.length;
      
      // 计算时间分布
      const phaseGroups = tddHistory.reduce((groups, entry) => {
        if (!groups[entry.phase]) groups[entry.phase] = [];
        groups[entry.phase].push(entry);
        return groups;
      }, {});

      progressInfo.timeSpent = {
        RED: this.calculateAverageTime(phaseGroups.RED || []),
        GREEN: this.calculateAverageTime(phaseGroups.GREEN || []),
        REFACTOR: this.calculateAverageTime(phaseGroups.REFACTOR || [])
      };

      // 计算效率指标
      progressInfo.efficiency = this.calculateEfficiency(progressInfo.timeSpent);
      progressInfo.velocity = this.calculateVelocity(tddHistory);

    } catch (error) {
      logger.warn('进度信息获取失败:', error.message);
    }

    return progressInfo;
  }

  /**
   * 获取上下文相关提示
   */
  async getContextualTips(state, projectInfo, progressInfo) {
    logger.info(`💡 生成上下文提示: ${state.phase || 'N/A'}阶段`);
    
    const tips = {
      primary: [],
      secondary: [],
      warnings: [],
      suggestions: []
    };

    try {
      // 基于当前阶段的提示
      if (state.phase) {
        tips.primary.push(...this.getPhaseSpecificTips(state.phase));
      }

      // 基于项目类型的提示
      tips.secondary.push(...this.getProjectSpecificTips(projectInfo));

      // 基于进度的提示
      tips.suggestions.push(...this.getProgressBasedTips(progressInfo));

      // 检查潜在问题
      tips.warnings.push(...this.detectPotentialIssues(state, projectInfo, progressInfo));

    } catch (error) {
      logger.warn('生成上下文提示失败:', error.message);
    }

    return tips;
  }

  /**
   * 获取阶段特定提示
   */
  getPhaseSpecificTips(phase) {
    const phaseTips = {
      'RED': [
        '🔴 编写会失败的测试，明确表达需求',
        '🎯 一次只测试一个行为或功能点',
        '📝 测试名称应该清楚描述期望行为',
        '⚡ 快速编写，不要纠结完美性'
      ],
      'GREEN': [
        '🟢 编写最小代码使测试通过',
        '🚫 不要过度设计或添加不必要功能',
        '⚡ 专注于让测试变绿，不考虑代码质量',
        '✅ 运行测试确保通过后再进入重构'
      ],
      'REFACTOR': [
        '🔧 保持测试通过的前提下改进代码',
        '🧹 消除重复代码，提高可读性',
        '📐 应用设计原则和模式',
        '⚡ 频繁运行测试确保重构安全'
      ]
    };

    return phaseTips[phase] || [];
  }

  /**
   * 获取项目特定提示
   */
  getProjectSpecificTips(projectInfo) {
    const tips = [];

    if (!projectInfo.hasTests) {
      tips.push('⚠️ 项目缺少测试目录，建议创建测试结构');
    }

    if (projectInfo.structure.testCoverage < 50) {
      tips.push(`📊 当前测试覆盖率较低 (${projectInfo.structure.testCoverage}%)，建议增加测试`);
    }

    switch (projectInfo.type) {
      case 'java':
        tips.push('☕ Java项目：遵循Maven/Gradle标准目录结构');
        if (projectInfo.buildTool === 'maven') {
          tips.push('🔨 使用 `mvn test` 运行测试');
        }
        break;
      case 'nodejs':
        tips.push('🟨 Node.js项目：考虑使用TypeScript提高代码质量');
        tips.push('🧪 运行 `npm test` 执行测试');
        break;
      case 'python':
        tips.push('🐍 Python项目：遵循PEP 8编码规范');
        tips.push('🧪 使用 `pytest` 运行测试');
        break;
    }

    return tips;
  }

  /**
   * 获取基于进度的提示
   */
  getProgressBasedTips(progressInfo) {
    const tips = [];

    if (progressInfo.currentCycle === 0) {
      tips.push('🎯 开始第一个TDD循环：先写测试！');
    } else if (progressInfo.currentCycle < 3) {
      tips.push(`🔄 已完成 ${progressInfo.currentCycle} 个TDD循环，继续保持节奏`);
    } else {
      tips.push(`🚀 已完成 ${progressInfo.currentCycle} 个循环，TDD节奏很好！`);
    }

    // 基于效率的建议
    if (progressInfo.efficiency > 80) {
      tips.push('⚡ TDD效率很高，保持当前节奏');
    } else if (progressInfo.efficiency < 50) {
      tips.push('🐌 TDD节奏较慢，可以适当加快');
    }

    return tips;
  }

  /**
   * 检测潜在问题
   */
  detectPotentialIssues(state, projectInfo, progressInfo) {
    const warnings = [];

    // 检查是否长时间停留在同一阶段
    if (state.phaseStartedAt) {
      const stayTime = Date.now() - new Date(state.phaseStartedAt).getTime();
      const stayMinutes = Math.floor(stayTime / (1000 * 60));
      
      if (stayMinutes > 30) {
        warnings.push(`⏰ 在${state.phase}阶段已停留${stayMinutes}分钟，可能需要推进`);
      }
    }

    // 检查项目配置
    if (!projectInfo.hasTests) {
      warnings.push('🚨 项目缺少测试，无法进行有效的TDD开发');
    }

    if (projectInfo.testFramework === 'unknown') {
      warnings.push('🔧 未检测到测试框架，请配置测试环境');
    }

    return warnings;
  }

  /**
   * 获取下一步建议
   */
  async getNextSteps(state, progressInfo) {
    const nextSteps = [];

    if (!state.feature) {
      nextSteps.push({
        action: 'create_feature',
        title: '创建新功能',
        description: '开始一个新的功能开发流程',
        priority: 'high'
      });
    } else if (!state.phase) {
      nextSteps.push({
        action: 'switch_to_red',
        title: '开始RED阶段',
        description: '编写第一个失败测试',
        priority: 'high'
      });
    } else {
      // 基于当前阶段推荐下一步
      const phaseNext = {
        'RED': {
          action: 'switch_to_green',
          title: '切换到GREEN阶段',
          description: '编写最小实现让测试通过'
        },
        'GREEN': {
          action: 'switch_to_refactor',
          title: '切换到REFACTOR阶段',
          description: '重构代码提高质量'
        },
        'REFACTOR': {
          action: 'switch_to_red',
          title: '开始新循环',
          description: '添加新测试开始下一个循环'
        }
      };

      if (phaseNext[state.phase]) {
        nextSteps.push({
          ...phaseNext[state.phase],
          priority: 'high'
        });
      }
    }

    return nextSteps;
  }

  /**
   * 生成状态行
   */
  generateStatusLine(state, progressInfo) {
    if (!state.feature) {
      return '🎯 TDD准备就绪 | 创建第一个功能开始开发';
    }

    const phase = state.phase || 'INIT';
    const phaseEmojis = {
      'RED': '🔴',
      'GREEN': '🟢',
      'REFACTOR': '🔧',
      'INIT': '🎯'
    };

    const cycleInfo = progressInfo.currentCycle > 0 ? 
      ` | 第${progressInfo.currentCycle}轮` : '';

    return `${phaseEmojis[phase]} ${phase} | ${state.feature}${cycleInfo}`;
  }

  /**
   * 评估项目健康度
   */
  assessProjectHealth(projectInfo, progressInfo) {
    let score = 0;
    const factors = [];

    // 测试覆盖率评分
    if (projectInfo.hasTests) {
      score += 30;
      factors.push('有测试结构');
    }

    const coverage = projectInfo.structure.testCoverage || 0;
    if (coverage > 70) {
      score += 30;
      factors.push('测试覆盖率良好');
    } else if (coverage > 40) {
      score += 15;
      factors.push('测试覆盖率一般');
    }

    // TDD实践评分
    if (progressInfo.currentCycle > 0) {
      score += 20;
      factors.push('有TDD实践');
    }

    if (progressInfo.efficiency > 70) {
      score += 20;
      factors.push('TDD效率高');
    } else if (progressInfo.efficiency > 50) {
      score += 10;
      factors.push('TDD效率一般');
    }

    const healthLevel = score >= 80 ? 'excellent' : 
                       score >= 60 ? 'good' : 
                       score >= 40 ? 'fair' : 'poor';

    return {
      score,
      level: healthLevel,
      factors
    };
  }

  /**
   * 计算持续时间
   */
  calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    return new Date(endTime).getTime() - new Date(startTime).getTime();
  }

  /**
   * 计算平均时间
   */
  calculateAverageTime(phases) {
    if (!phases.length) return 0;
    const totalTime = phases.reduce((sum, phase) => 
      sum + this.calculateDuration(phase.startedAt, phase.completedAt), 0
    );
    return Math.round(totalTime / phases.length / 1000 / 60); // 返回分钟数
  }

  /**
   * 计算效率
   */
  calculateEfficiency(timeSpent) {
    const totalTime = timeSpent.RED + timeSpent.GREEN + timeSpent.REFACTOR;
    if (totalTime === 0) return 0;
    
    // 理想时间分布：RED(30%), GREEN(40%), REFACTOR(30%)
    const idealRatio = Math.abs(timeSpent.RED / totalTime - 0.3) + 
                      Math.abs(timeSpent.GREEN / totalTime - 0.4) + 
                      Math.abs(timeSpent.REFACTOR / totalTime - 0.3);
    
    return Math.max(0, 100 - idealRatio * 100);
  }

  /**
   * 计算开发速度
   */
  calculateVelocity(history) {
    if (history.length < 2) return 0;
    
    const timeSpan = new Date(history[history.length - 1].startedAt).getTime() - 
                    new Date(history[0].startedAt).getTime();
    const hours = timeSpan / (1000 * 60 * 60);
    
    return hours > 0 ? Math.round(history.length / hours * 10) / 10 : 0; // 每小时完成的阶段数
  }

  /**
   * 清理缓存
   */
  clearCache(projectRoot) {
    this.statusCache.delete(projectRoot);
    this.progressTrackers.delete(projectRoot);
  }

  /**
   * 获取缓存的状态
   */
  getCachedStatus(projectRoot) {
    return this.statusCache.get(projectRoot);
  }
}

export { TDDStatusManager };