import { createLogger } from '../utils/logger.js';
import { TDDStatusManager } from '../tdd/status-manager.js';
import { TDDPhaseManager } from '../tdd/phase-manager.js';

const logger = createLogger('StatusDisplay');

// 全局状态管理器实例
let globalStatusManager = null;

/**
 * 获取或创建状态管理器实例
 */
function getStatusManager(sessionManager) {
  if (!globalStatusManager) {
    const phaseManager = new TDDPhaseManager(sessionManager);
    globalStatusManager = new TDDStatusManager(sessionManager, phaseManager);
  }
  return globalStatusManager;
}

/**
 * 获取增强的TDD状态
 */
export async function handleGetEnhancedStatus(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📊 获取增强TDD状态: ${projectRoot}`);
  
  try {
    const statusManager = getStatusManager(sessionManager);
    const enhancedStatus = await statusManager.getEnhancedStatus(projectRoot);
    
    logger.info(`✅ 增强状态获取成功`);
    
    return {
      success: true,
      data: enhancedStatus,
      message: formatStatusMessage(enhancedStatus)
    };
    
  } catch (error) {
    logger.error('获取增强状态失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_ENHANCED_STATUS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取状态仪表盘
 */
export async function handleGetStatusDashboard(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📊 获取状态仪表盘: ${projectRoot}`);
  
  try {
    const statusManager = getStatusManager(sessionManager);
    const enhancedStatus = await statusManager.getEnhancedStatus(projectRoot);
    
    // 生成仪表盘数据
    const dashboard = {
      overview: generateOverviewSection(enhancedStatus),
      progress: generateProgressSection(enhancedStatus),
      health: generateHealthSection(enhancedStatus),
      recommendations: generateRecommendationsSection(enhancedStatus),
      quickActions: generateQuickActionsSection(enhancedStatus)
    };
    
    logger.info(`✅ 状态仪表盘生成成功`);
    
    return {
      success: true,
      data: dashboard,
      message: '状态仪表盘已生成'
    };
    
  } catch (error) {
    logger.error('获取状态仪表盘失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_STATUS_DASHBOARD_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取上下文提示
 */
export async function handleGetContextTips(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`💡 获取上下文提示: ${projectRoot}`);
  
  try {
    const statusManager = getStatusManager(sessionManager);
    const enhancedStatus = await statusManager.getEnhancedStatus(projectRoot);
    
    const contextTips = {
      currentPhase: enhancedStatus.state.phase,
      tips: enhancedStatus.contextualTips,
      nextSteps: enhancedStatus.nextSteps,
      statusLine: enhancedStatus.statusLine,
      formatted: formatContextTips(enhancedStatus.contextualTips)
    };
    
    logger.info(`✅ 上下文提示获取成功`);
    
    return {
      success: true,
      data: contextTips,
      message: `${enhancedStatus.state.phase || 'INIT'}阶段上下文提示`
    };
    
  } catch (error) {
    logger.error('获取上下文提示失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_CONTEXT_TIPS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取项目健康度
 */
export async function handleGetProjectHealth(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🏥 获取项目健康度: ${projectRoot}`);
  
  try {
    const statusManager = getStatusManager(sessionManager);
    const enhancedStatus = await statusManager.getEnhancedStatus(projectRoot);
    
    const healthReport = {
      ...enhancedStatus.health,
      projectInfo: {
        type: enhancedStatus.projectInfo.type,
        hasTests: enhancedStatus.projectInfo.hasTests,
        testCoverage: enhancedStatus.projectInfo.structure.testCoverage,
        testFramework: enhancedStatus.projectInfo.testFramework
      },
      recommendations: generateHealthRecommendations(enhancedStatus.health, enhancedStatus.projectInfo),
      trend: calculateHealthTrend(enhancedStatus.progressInfo)
    };
    
    logger.info(`✅ 项目健康度评估完成: ${healthReport.level}`);
    
    return {
      success: true,
      data: healthReport,
      message: `项目健康度: ${getHealthLevelText(healthReport.level)} (${healthReport.score}/100)`
    };
    
  } catch (error) {
    logger.error('获取项目健康度失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_PROJECT_HEALTH_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取进度报告
 */
export async function handleGetProgressReport(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📈 获取进度报告: ${projectRoot}`);
  
  try {
    const statusManager = getStatusManager(sessionManager);
    const enhancedStatus = await statusManager.getEnhancedStatus(projectRoot);
    
    const progressReport = {
      summary: {
        currentCycle: enhancedStatus.progressInfo.currentCycle,
        totalPhases: enhancedStatus.progressInfo.phaseHistory.length,
        efficiency: Math.round(enhancedStatus.progressInfo.efficiency),
        velocity: enhancedStatus.progressInfo.velocity
      },
      timeDistribution: enhancedStatus.progressInfo.timeSpent,
      phaseHistory: enhancedStatus.progressInfo.phaseHistory.slice(-10), // 最近10个阶段
      trends: calculateProgressTrends(enhancedStatus.progressInfo),
      milestones: identifyMilestones(enhancedStatus.progressInfo)
    };
    
    logger.info(`✅ 进度报告生成完成`);
    
    return {
      success: true,
      data: progressReport,
      message: `TDD进度: ${progressReport.summary.currentCycle}个循环, 效率${progressReport.summary.efficiency}%`
    };
    
  } catch (error) {
    logger.error('获取进度报告失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_PROGRESS_REPORT_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 格式化状态消息
 */
function formatStatusMessage(enhancedStatus) {
  const { state, projectInfo, health } = enhancedStatus;
  
  let message = enhancedStatus.statusLine;
  
  if (projectInfo.type !== 'unknown') {
    message += ` | ${projectInfo.type.toUpperCase()}项目`;
  }
  
  if (health.level) {
    message += ` | 健康度: ${getHealthLevelText(health.level)}`;
  }
  
  return message;
}

/**
 * 生成概览部分
 */
function generateOverviewSection(enhancedStatus) {
  return {
    statusLine: enhancedStatus.statusLine,
    project: {
      type: enhancedStatus.projectInfo.type,
      language: enhancedStatus.projectInfo.language,
      testFramework: enhancedStatus.projectInfo.testFramework,
      hasTests: enhancedStatus.projectInfo.hasTests
    },
    current: {
      feature: enhancedStatus.state.feature,
      phase: enhancedStatus.state.phase,
      phaseStartedAt: enhancedStatus.state.phaseStartedAt
    },
    health: {
      score: enhancedStatus.health.score,
      level: enhancedStatus.health.level,
      levelText: getHealthLevelText(enhancedStatus.health.level)
    }
  };
}

/**
 * 生成进度部分
 */
function generateProgressSection(enhancedStatus) {
  const progress = enhancedStatus.progressInfo;
  
  return {
    cycles: progress.currentCycle,
    phases: progress.phaseHistory.length,
    efficiency: Math.round(progress.efficiency),
    velocity: progress.velocity,
    timeSpent: progress.timeSpent,
    recentActivity: progress.phaseHistory.slice(-5).map(p => ({
      phase: p.phase,
      duration: Math.round(p.duration / (1000 * 60)), // 转换为分钟
      feature: p.feature
    }))
  };
}

/**
 * 生成健康度部分
 */
function generateHealthSection(enhancedStatus) {
  return {
    score: enhancedStatus.health.score,
    level: enhancedStatus.health.level,
    factors: enhancedStatus.health.factors,
    testCoverage: enhancedStatus.projectInfo.structure.testCoverage,
    recommendations: generateHealthRecommendations(
      enhancedStatus.health, 
      enhancedStatus.projectInfo
    )
  };
}

/**
 * 生成建议部分
 */
function generateRecommendationsSection(enhancedStatus) {
  const recommendations = [];
  
  // 合并各种建议
  recommendations.push(...enhancedStatus.contextualTips.primary);
  recommendations.push(...enhancedStatus.contextualTips.suggestions);
  
  return {
    immediate: enhancedStatus.nextSteps,
    contextual: recommendations.slice(0, 5), // 最多显示5个建议
    warnings: enhancedStatus.contextualTips.warnings
  };
}

/**
 * 生成快捷操作部分
 */
function generateQuickActionsSection(enhancedStatus) {
  const actions = [];
  
  // 基于当前状态生成快捷操作
  if (!enhancedStatus.state.feature) {
    actions.push({
      id: 'create_feature',
      title: '创建功能',
      command: 'tdd_create_feature',
      icon: '🎯'
    });
  }
  
  if (enhancedStatus.state.feature && !enhancedStatus.state.phase) {
    actions.push({
      id: 'start_red',
      title: '开始RED',
      command: 'tdd_switch_phase --phase=RED',
      icon: '🔴'
    });
  }
  
  // 通用快捷操作
  actions.push(
    {
      id: 'run_tests',
      title: '运行测试',
      command: 'tdd_trigger_test',
      icon: '🧪'
    },
    {
      id: 'view_results',
      title: '查看结果',
      command: 'tdd_get_test_result',
      icon: '📊'
    }
  );
  
  return actions;
}

/**
 * 格式化上下文提示
 */
function formatContextTips(contextualTips) {
  const formatted = [];
  
  if (contextualTips.primary.length > 0) {
    formatted.push('🎯 **当前阶段重点**:');
    contextualTips.primary.forEach(tip => formatted.push(`  ${tip}`));
    formatted.push('');
  }
  
  if (contextualTips.warnings.length > 0) {
    formatted.push('⚠️ **注意事项**:');
    contextualTips.warnings.forEach(warning => formatted.push(`  ${warning}`));
    formatted.push('');
  }
  
  if (contextualTips.suggestions.length > 0) {
    formatted.push('💡 **改进建议**:');
    contextualTips.suggestions.forEach(suggestion => formatted.push(`  ${suggestion}`));
  }
  
  return formatted.join('\n');
}

/**
 * 生成健康度建议
 */
function generateHealthRecommendations(health, projectInfo) {
  const recommendations = [];
  
  if (health.score < 50) {
    recommendations.push('🚨 项目健康度较低，建议重点关注测试质量');
  }
  
  if (!projectInfo.hasTests) {
    recommendations.push('📝 添加测试目录和基础测试结构');
  }
  
  if (projectInfo.structure.testCoverage < 60) {
    recommendations.push('📊 提高测试覆盖率，目标达到70%以上');
  }
  
  if (projectInfo.testFramework === 'unknown') {
    recommendations.push('🔧 配置合适的测试框架');
  }
  
  return recommendations;
}

/**
 * 计算健康度趋势
 */
function calculateHealthTrend(progressInfo) {
  if (progressInfo.phaseHistory.length < 5) {
    return 'insufficient_data';
  }
  
  // 简单的趋势计算：最近的效率是否在提升
  const recentEfficiency = progressInfo.efficiency;
  const threshold = 60;
  
  if (recentEfficiency > threshold) {
    return 'improving';
  } else if (recentEfficiency < threshold - 20) {
    return 'declining';
  } else {
    return 'stable';
  }
}

/**
 * 计算进度趋势
 */
function calculateProgressTrends(progressInfo) {
  return {
    cycleGrowth: progressInfo.currentCycle > 0 ? 'positive' : 'none',
    efficiencyTrend: progressInfo.efficiency > 70 ? 'high' : 
                     progressInfo.efficiency > 50 ? 'medium' : 'low',
    velocityTrend: progressInfo.velocity > 1 ? 'fast' : 'slow'
  };
}

/**
 * 识别里程碑
 */
function identifyMilestones(progressInfo) {
  const milestones = [];
  
  if (progressInfo.currentCycle === 1) {
    milestones.push({
      type: 'first_cycle',
      title: '完成第一个TDD循环',
      achieved: true
    });
  }
  
  if (progressInfo.currentCycle >= 5) {
    milestones.push({
      type: 'experienced',
      title: '经验丰富的TDD开发者',
      achieved: true
    });
  }
  
  if (progressInfo.efficiency > 80) {
    milestones.push({
      type: 'efficient',
      title: 'TDD效率专家',
      achieved: true
    });
  }
  
  return milestones;
}

/**
 * 获取健康度等级文本
 */
function getHealthLevelText(level) {
  const levelTexts = {
    'excellent': '优秀',
    'good': '良好',
    'fair': '一般',
    'poor': '较差'
  };
  
  return levelTexts[level] || '未知';
}