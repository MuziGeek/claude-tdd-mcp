import { createLogger } from '../utils/logger.js';
import { TDDPhaseManager } from '../tdd/phase-manager.js';

const logger = createLogger('TDDWorkflow');

/**
 * 处理TDD阶段切换
 */
export async function handleSwitchPhase(args, sessionManager) {
  const { projectRoot, phase, featureId } = args;
  
  logger.info(`🔄 切换TDD阶段: ${phase} (项目: ${projectRoot})`);
  
  try {
    const phaseManager = new TDDPhaseManager(sessionManager);
    const result = await phaseManager.switchPhase(projectRoot, phase.toUpperCase(), featureId);
    
    logger.info(`✅ TDD阶段切换成功: ${phase}`);
    
    return {
      success: true,
      data: result,
      message: `已切换到${phase}阶段: ${result.phaseInfo.description}`
    };
    
  } catch (error) {
    logger.error('TDD阶段切换失败:', error);
    
    return {
      success: false,
      error: {
        code: 'TDD_PHASE_SWITCH_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 处理获取TDD状态
 */
export async function handleGetTDDStatus(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📊 获取TDD状态: ${projectRoot}`);
  
  try {
    const phaseManager = new TDDPhaseManager(sessionManager);
    const result = await phaseManager.getCurrentState(projectRoot);
    
    logger.info(`✅ TDD状态获取成功`);
    
    return {
      success: true,
      data: result,
      message: result.state.feature ? 
        `当前特性: ${result.state.feature} (${result.state.phase || '未启动'}阶段)` :
        '没有活动的TDD特性'
    };
    
  } catch (error) {
    logger.error('获取TDD状态失败:', error);
    
    return {
      success: false,
      error: {
        code: 'TDD_STATUS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 处理创建TDD特性
 */
export async function handleCreateFeature(args, sessionManager) {
  const { projectRoot, featureId, description } = args;
  
  logger.info(`🎯 创建TDD特性: ${featureId}`);
  
  try {
    const phaseManager = new TDDPhaseManager(sessionManager);
    const result = await phaseManager.createFeature(projectRoot, featureId, description);
    
    logger.info(`✅ TDD特性创建成功: ${featureId}`);
    
    return {
      success: true,
      data: result,
      message: `特性 ${featureId} 已创建，可以开始TDD开发流程`
    };
    
  } catch (error) {
    logger.error('创建TDD特性失败:', error);
    
    return {
      success: false,
      error: {
        code: 'TDD_CREATE_FEATURE_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 处理完成TDD阶段
 */
export async function handleCompletePhase(args, sessionManager) {
  const { projectRoot, result } = args;
  
  logger.info(`✅ 完成TDD阶段: ${projectRoot}`);
  
  try {
    const phaseManager = new TDDPhaseManager(sessionManager);
    const phaseResult = await phaseManager.completePhase(projectRoot, result);
    
    logger.info(`✅ TDD阶段完成: ${phaseResult.completedPhase}`);
    
    return {
      success: true,
      data: phaseResult,
      message: `${phaseResult.completedPhase}阶段已完成${phaseResult.nextPhase ? `，建议切换到${phaseResult.nextPhase}阶段` : ''}`
    };
    
  } catch (error) {
    logger.error('完成TDD阶段失败:', error);
    
    return {
      success: false,
      error: {
        code: 'TDD_COMPLETE_PHASE_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 处理文件路径验证
 */
export async function handleValidateFilePath(args, sessionManager) {
  const { projectRoot, filePath } = args;
  
  logger.info(`🔍 验证文件路径: ${filePath}`);
  
  try {
    const phaseManager = new TDDPhaseManager(sessionManager);
    const session = await sessionManager.getOrCreateSession(projectRoot);
    const currentPhase = session.tddState?.currentPhase;
    
    const validation = phaseManager.validateFilePath(currentPhase, filePath);
    
    logger.info(`✅ 文件路径验证完成: ${validation.allowed ? '允许' : '禁止'}`);
    
    return {
      success: true,
      data: {
        filePath,
        currentPhase,
        validation
      },
      message: validation.allowed ? 
        '文件路径符合当前TDD阶段规则' :
        validation.reason
    };
    
  } catch (error) {
    logger.error('文件路径验证失败:', error);
    
    return {
      success: false,
      error: {
        code: 'TDD_VALIDATE_PATH_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}