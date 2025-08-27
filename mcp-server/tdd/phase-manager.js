import fs from 'fs-extra';
import path from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TDDPhaseManager');

/**
 * TDD阶段管理器
 * 管理RED/GREEN/REFACTOR阶段的切换和状态跟踪
 */
class TDDPhaseManager {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.phases = {
      RED: {
        name: 'RED',
        description: '编写失败的测试',
        allowedActions: ['write_test', 'run_test'],
        restrictedPaths: [
          'src/main/**/*',
          'lib/**/*',
          'app/**/*'
        ],
        allowedPaths: [
          'tests/**/*',
          'test/**/*',
          'spec/**/*',
          '__tests__/**/*'
        ]
      },
      GREEN: {
        name: 'GREEN',
        description: '编写最小代码使测试通过',
        allowedActions: ['write_code', 'run_test'],
        restrictedPaths: [
          'tests/**/*',
          'test/**/*',
          'spec/**/*',
          '__tests__/**/*'
        ],
        allowedPaths: [
          'src/**/*',
          'lib/**/*',
          'app/**/*'
        ]
      },
      REFACTOR: {
        name: 'REFACTOR',
        description: '重构代码提高质量',
        allowedActions: ['refactor_code', 'run_test'],
        restrictedPaths: [],
        allowedPaths: [
          'src/**/*',
          'lib/**/*',
          'app/**/*',
          'tests/**/*',
          'test/**/*',
          'spec/**/*',
          '__tests__/**/*'
        ]
      }
    };
  }

  /**
   * 切换TDD阶段
   */
  async switchPhase(projectRoot, newPhase, featureId) {
    logger.info(`🔄 切换TDD阶段: ${newPhase} (特性: ${featureId})`);
    
    if (!this.phases[newPhase]) {
      throw new Error(`无效的TDD阶段: ${newPhase}`);
    }
    
    try {
      // 获取当前会话
      const session = await this.sessionManager.getOrCreateSession(projectRoot);
      
      // 验证阶段切换的合法性
      await this.validatePhaseTransition(session, newPhase);
      
      // 更新会话状态
      await this.sessionManager.updateSession(projectRoot, {
        tddState: {
          currentFeature: featureId || session.tddState?.currentFeature,
          currentPhase: newPhase,
          phaseStartedAt: new Date().toISOString(),
          history: [
            ...(session.tddState?.history || []),
            {
              phase: newPhase,
              startedAt: new Date().toISOString(),
              feature: featureId || session.tddState?.currentFeature
            }
          ]
        }
      });
      
      // 保存TDD状态到项目文件
      await this.saveTDDState(projectRoot, {
        feature: featureId || session.tddState?.currentFeature,
        phase: newPhase,
        lastUpdated: new Date().toISOString()
      });
      
      logger.info(`✅ 已切换到${newPhase}阶段`);
      
      return {
        success: true,
        currentPhase: newPhase,
        feature: featureId || session.tddState?.currentFeature,
        phaseInfo: this.phases[newPhase],
        recommendations: this.getPhaseRecommendations(newPhase)
      };
      
    } catch (error) {
      logger.error('TDD阶段切换失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前TDD状态
   */
  async getCurrentState(projectRoot) {
    logger.info(`📊 获取TDD状态: ${projectRoot}`);
    
    try {
      const session = await this.sessionManager.getOrCreateSession(projectRoot);
      
      // 检查项目TDD状态文件
      const stateFile = path.join(projectRoot, '.claude/cache/tdd_state.json');
      let fileState = null;
      
      if (await fs.pathExists(stateFile)) {
        fileState = await fs.readJson(stateFile);
      }
      
      const currentState = {
        feature: fileState?.feature || session.tddState?.currentFeature,
        phase: fileState?.phase || session.tddState?.currentPhase,
        phaseStartedAt: session.tddState?.phaseStartedAt,
        lastUpdated: fileState?.lastUpdated,
        history: session.tddState?.history || [],
        phaseInfo: null
      };
      
      if (currentState.phase) {
        currentState.phaseInfo = this.phases[currentState.phase];
      }
      
      return {
        success: true,
        state: currentState,
        hasActiveFeature: !!currentState.feature,
        isInTDDCycle: !!currentState.phase
      };
      
    } catch (error) {
      logger.error('获取TDD状态失败:', error);
      throw error;
    }
  }

  /**
   * 创建新特性的TDD流程
   */
  async createFeature(projectRoot, featureId, description) {
    logger.info(`🎯 创建新特性: ${featureId}`);
    
    try {
      // 更新会话状态
      await this.sessionManager.updateSession(projectRoot, {
        tddState: {
          currentFeature: featureId,
          currentPhase: null,
          featureDescription: description,
          createdAt: new Date().toISOString(),
          history: []
        }
      });
      
      // 保存到项目文件
      await this.saveTDDState(projectRoot, {
        feature: featureId,
        phase: null,
        description,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      
      logger.info(`✅ 特性${featureId}创建完成`);
      
      return {
        success: true,
        feature: {
          id: featureId,
          description,
          createdAt: new Date().toISOString()
        },
        nextSteps: [
          '使用tdd_switch_phase切换到RED阶段开始编写测试',
          '确保测试清晰地表达需求',
          '运行测试确认失败'
        ]
      };
      
    } catch (error) {
      logger.error('创建特性失败:', error);
      throw error;
    }
  }

  /**
   * 完成当前TDD阶段
   */
  async completePhase(projectRoot, result) {
    logger.info(`✅ 完成TDD阶段: ${projectRoot}`);
    
    try {
      const session = await this.sessionManager.getOrCreateSession(projectRoot);
      const currentPhase = session.tddState?.currentPhase;
      
      if (!currentPhase) {
        throw new Error('没有活动的TDD阶段');
      }
      
      // 记录阶段完成
      const historyEntry = {
        phase: currentPhase,
        startedAt: session.tddState?.phaseStartedAt,
        completedAt: new Date().toISOString(),
        result,
        feature: session.tddState?.currentFeature
      };
      
      await this.sessionManager.updateSession(projectRoot, {
        tddState: {
          ...session.tddState,
          lastCompletedPhase: currentPhase,
          lastCompletedAt: new Date().toISOString(),
          history: [
            ...(session.tddState?.history || []),
            historyEntry
          ]
        }
      });
      
      // 建议下一个阶段
      const nextPhase = this.suggestNextPhase(currentPhase);
      
      logger.info(`✅ ${currentPhase}阶段完成`);
      
      return {
        success: true,
        completedPhase: currentPhase,
        result,
        nextPhase,
        recommendations: nextPhase ? this.getPhaseRecommendations(nextPhase) : []
      };
      
    } catch (error) {
      logger.error('完成TDD阶段失败:', error);
      throw error;
    }
  }

  /**
   * 验证文件路径是否符合当前阶段规则
   */
  validateFilePath(currentPhase, filePath) {
    if (!currentPhase || !this.phases[currentPhase]) {
      return { allowed: true, reason: '没有活动的TDD阶段' };
    }
    
    const phase = this.phases[currentPhase];
    const normalizedPath = filePath.replace(/\\\\/g, '/');
    
    // 检查受限路径
    for (const restrictedPattern of phase.restrictedPaths) {
      const pattern = restrictedPattern.replace('**/*', '.*');
      const regex = new RegExp(pattern);
      
      if (regex.test(normalizedPath)) {
        return {
          allowed: false,
          reason: `${currentPhase}阶段不允许修改${restrictedPattern}路径下的文件`
        };
      }
    }
    
    // 检查允许路径
    if (phase.allowedPaths.length > 0) {
      let pathAllowed = false;
      
      for (const allowedPattern of phase.allowedPaths) {
        const pattern = allowedPattern.replace('**/*', '.*');
        const regex = new RegExp(pattern);
        
        if (regex.test(normalizedPath)) {
          pathAllowed = true;
          break;
        }
      }
      
      if (!pathAllowed) {
        return {
          allowed: false,
          reason: `${currentPhase}阶段只允许修改${phase.allowedPaths.join(', ')}路径下的文件`
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * 验证阶段转换的合法性
   */
  async validatePhaseTransition(session, newPhase) {
    const currentPhase = session.tddState?.currentPhase;
    
    // 如果没有当前阶段，可以切换到任何阶段
    if (!currentPhase) {
      return true;
    }
    
    // 验证TDD循环顺序（建议，不强制）
    const validTransitions = {
      'RED': ['GREEN', 'REFACTOR'],
      'GREEN': ['REFACTOR', 'RED'],
      'REFACTOR': ['RED', 'GREEN']
    };
    
    if (!validTransitions[currentPhase]?.includes(newPhase)) {
      logger.warn(`非标准的TDD阶段转换: ${currentPhase} -> ${newPhase}`);
    }
    
    return true;
  }

  /**
   * 保存TDD状态到项目文件
   */
  async saveTDDState(projectRoot, state) {
    const stateFile = path.join(projectRoot, '.claude/cache/tdd_state.json');
    await fs.ensureDir(path.dirname(stateFile));
    await fs.writeJson(stateFile, state, { spaces: 2 });
  }

  /**
   * 建议下一个TDD阶段
   */
  suggestNextPhase(currentPhase) {
    const suggestions = {
      'RED': 'GREEN',
      'GREEN': 'REFACTOR',
      'REFACTOR': 'RED'
    };
    
    return suggestions[currentPhase];
  }

  /**
   * 获取阶段推荐
   */
  getPhaseRecommendations(phase) {
    const recommendations = {
      'RED': [
        '只编写测试代码，不编写生产代码',
        '确保测试失败（因为没有实现）',
        '测试应该清晰地表达需求',
        '一次只测试一个行为'
      ],
      'GREEN': [
        '只编写生产代码，不编写测试代码',
        '编写最少的代码使测试通过',
        '不考虑代码质量，只关注功能实现',
        '快速让测试变绿'
      ],
      'REFACTOR': [
        '保持测试通过',
        '改进代码结构和可读性',
        '消除重复代码',
        '应用设计模式',
        '优化性能'
      ]
    };
    
    return recommendations[phase] || [];
  }
}

export { TDDPhaseManager };