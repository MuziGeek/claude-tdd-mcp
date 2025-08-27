import { createLogger } from '../utils/logger.js';
import { SmartCommandSystem } from '../core/command-system.js';

const logger = createLogger('SmartCommand');

/**
 * 智能命令处理器
 * 统一处理自然语言输入和别名命令
 */
export async function handleSmartCommand(args, sessionManager, toolRegistry) {
  const { projectRoot, input } = args;
  
  logger.info(`处理智能命令: ${input}`);
  
  try {
    // 创建智能命令系统实例
    const commandSystem = new SmartCommandSystem(toolRegistry, sessionManager);
    
    // 处理自然语言输入
    const result = await commandSystem.processNaturalLanguage(input, projectRoot);
    
    logger.info(`智能命令处理完成: ${result.success ? '成功' : '失败'}`);
    
    return {
      success: result.success,
      data: result,
      message: result.success ? 
        `✅ ${result.description}` :
        `❌ ${result.message || '命令执行失败'}`
    };
    
  } catch (error) {
    logger.error('智能命令处理失败:', error);
    
    return {
      success: false,
      error: {
        code: 'SMART_COMMAND_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 处理别名查询
 */
export async function handleListAliases(args, sessionManager, toolRegistry) {
  logger.info('获取命令别名列表');
  
  try {
    const commandSystem = new SmartCommandSystem(toolRegistry, sessionManager);
    const aliases = commandSystem.getAllAliases();
    
    return {
      success: true,
      data: {
        aliases,
        total: Object.values(aliases).reduce((sum, group) => sum + group.length, 0)
      },
      message: '命令别名列表获取成功'
    };
    
  } catch (error) {
    logger.error('获取别名列表失败:', error);
    
    return {
      success: false,
      error: {
        code: 'LIST_ALIASES_FAILED',
        message: error.message
      }
    };
  }
}

/**
 * 处理帮助命令
 */
export async function handleSmartHelp(args, sessionManager, toolRegistry) {
  logger.info('显示智能命令帮助');
  
  try {
    const commandSystem = new SmartCommandSystem(toolRegistry, sessionManager);
    const helpInfo = commandSystem.generateHelpInfo();
    
    return {
      success: true,
      data: helpInfo.data,
      message: '智能命令帮助信息'
    };
    
  } catch (error) {
    logger.error('显示帮助失败:', error);
    
    return {
      success: false,
      error: {
        code: 'SMART_HELP_FAILED',
        message: error.message
      }
    };
  }
}