import { createLogger } from '../utils/logger.js';
import { AutoTestRunner } from '../tdd/auto-test-runner.js';
import { TDDPhaseManager } from '../tdd/phase-manager.js';

const logger = createLogger('AutoTest');

// 全局自动测试运行器实例
let globalAutoTestRunner = null;

/**
 * 获取或创建自动测试运行器实例
 */
function getAutoTestRunner(sessionManager) {
  if (!globalAutoTestRunner) {
    const phaseManager = new TDDPhaseManager(sessionManager);
    globalAutoTestRunner = new AutoTestRunner(sessionManager, phaseManager);
  }
  return globalAutoTestRunner;
}

/**
 * 启动自动测试监听
 */
export async function handleStartAutoTest(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🚀 启动自动测试: ${projectRoot}`);
  
  try {
    const autoTestRunner = getAutoTestRunner(sessionManager);
    const result = await autoTestRunner.startWatching(projectRoot);
    
    logger.info(`✅ 自动测试启动成功`);
    
    return {
      success: true,
      data: {
        ...result,
        message: '自动测试监听已启动',
        features: [
          '文件变更自动检测',
          '智能测试运行',
          'TDD阶段推进建议',
          '测试结果缓存'
        ]
      },
      message: `自动测试监听已启动 (${result.projectType})`
    };
    
  } catch (error) {
    logger.error('启动自动测试失败:', error);
    
    return {
      success: false,
      error: {
        code: 'AUTO_TEST_START_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 停止自动测试监听
 */
export async function handleStopAutoTest(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`⏹️ 停止自动测试: ${projectRoot}`);
  
  try {
    const autoTestRunner = getAutoTestRunner(sessionManager);
    await autoTestRunner.stopWatching(projectRoot);
    
    logger.info(`✅ 自动测试停止成功`);
    
    return {
      success: true,
      data: {
        message: '自动测试监听已停止'
      },
      message: '自动测试监听已停止'
    };
    
  } catch (error) {
    logger.error('停止自动测试失败:', error);
    
    return {
      success: false,
      error: {
        code: 'AUTO_TEST_STOP_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 手动触发测试
 */
export async function handleTriggerTest(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🔄 手动触发测试: ${projectRoot}`);
  
  try {
    const autoTestRunner = getAutoTestRunner(sessionManager);
    await autoTestRunner.triggerTests(projectRoot);
    
    // 获取测试结果
    const lastResult = autoTestRunner.getLastTestResult(projectRoot);
    
    logger.info(`✅ 手动测试触发成功`);
    
    return {
      success: true,
      data: {
        triggered: true,
        lastResult,
        message: '测试已手动触发'
      },
      message: lastResult ? 
        `测试触发完成: ${lastResult.result.success ? '通过' : '失败'}` :
        '测试已触发，请稍候查看结果'
    };
    
  } catch (error) {
    logger.error('手动触发测试失败:', error);
    
    return {
      success: false,
      error: {
        code: 'TRIGGER_TEST_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取测试结果
 */
export async function handleGetTestResult(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📊 获取测试结果: ${projectRoot}`);
  
  try {
    const autoTestRunner = getAutoTestRunner(sessionManager);
    const lastResult = autoTestRunner.getLastTestResult(projectRoot);
    const testHistory = autoTestRunner.getTestHistory(projectRoot);
    
    logger.info(`✅ 测试结果获取成功`);
    
    if (!lastResult) {
      return {
        success: true,
        data: {
          hasResult: false,
          message: '暂无测试结果',
          history: testHistory
        },
        message: '暂无测试结果，可以手动触发测试'
      };
    }
    
    return {
      success: true,
      data: {
        hasResult: true,
        lastResult,
        history: testHistory,
        summary: {
          phase: lastResult.phase,
          passed: lastResult.result.success,
          timestamp: lastResult.timestamp,
          testSummary: lastResult.result.summary,
          suggestions: lastResult.suggestion
        }
      },
      message: `最近测试结果: ${lastResult.result.success ? '✅ 通过' : '❌ 失败'} (${lastResult.phase}阶段)`
    };
    
  } catch (error) {
    logger.error('获取测试结果失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_TEST_RESULT_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取测试建议
 */
export async function handleGetTestSuggestions(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`💡 获取测试建议: ${projectRoot}`);
  
  try {
    const autoTestRunner = getAutoTestRunner(sessionManager);
    const lastResult = autoTestRunner.getLastTestResult(projectRoot);
    
    if (!lastResult || !lastResult.suggestion) {
      return {
        success: true,
        data: {
          hasSuggestions: false,
          message: '暂无测试建议，请先运行测试'
        },
        message: '暂无测试建议'
      };
    }
    
    const { suggestion } = lastResult;
    
    // 格式化建议信息
    const formattedSuggestions = {
      phase: suggestion.phase,
      canProgress: suggestion.canProgress,
      nextPhase: suggestion.nextPhase,
      testSummary: suggestion.testSummary,
      actions: suggestion.actions,
      warnings: suggestion.warnings,
      recommendations: []
    };
    
    // 生成具体推荐
    if (suggestion.canProgress && suggestion.nextPhase) {
      formattedSuggestions.recommendations.push(
        `🎯 建议切换到 ${suggestion.nextPhase} 阶段`
      );
    }
    
    if (suggestion.actions.length > 0) {
      formattedSuggestions.recommendations.push(
        `📝 下一步行动: ${suggestion.actions[0]}`
      );
    }
    
    logger.info(`✅ 测试建议获取成功`);
    
    return {
      success: true,
      data: {
        hasSuggestions: true,
        suggestions: formattedSuggestions,
        timestamp: lastResult.timestamp
      },
      message: `${suggestion.phase}阶段建议 (${suggestion.canProgress ? '可推进' : '需改进'})`
    };
    
  } catch (error) {
    logger.error('获取测试建议失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_TEST_SUGGESTIONS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取自动测试状态
 */
export async function handleGetAutoTestStatus(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🔍 获取自动测试状态: ${projectRoot}`);
  
  try {
    const autoTestRunner = getAutoTestRunner(sessionManager);
    const isWatching = autoTestRunner.watchers.has(projectRoot);
    const lastResult = autoTestRunner.getLastTestResult(projectRoot);
    const testHistory = autoTestRunner.getTestHistory(projectRoot);
    const isRunning = autoTestRunner.runningTests.has(projectRoot);
    
    const status = {
      isWatching,
      isRunning,
      hasRecentResult: !!lastResult,
      testCount: testHistory.length,
      lastTestTime: lastResult?.timestamp,
      lastTestPassed: lastResult?.result?.success,
      currentPhase: lastResult?.phase
    };
    
    logger.info(`✅ 自动测试状态获取成功`);
    
    return {
      success: true,
      data: status,
      message: isWatching ? 
        `自动测试监听中 ${isRunning ? '(运行中)' : '(待机)'}` : 
        '自动测试未启动'
    };
    
  } catch (error) {
    logger.error('获取自动测试状态失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_AUTO_TEST_STATUS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}