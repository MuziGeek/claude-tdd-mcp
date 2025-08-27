import { createLogger } from '../utils/logger.js';
import fs from 'fs-extra';
import path from 'path';

const logger = createLogger('Configuration');

/**
 * 获取状态
 */
export async function handleGetStatus(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📊 获取状态: ${projectRoot}`);
  
  try {
    const session = await sessionManager.getOrCreateSession(projectRoot);
    
    if (!session) {
      return {
        success: true,
        data: {
          initialized: false,
          message: '项目尚未初始化，请运行 tdd_initialize'
        }
      };
    }
    
    return {
      success: true,
      data: {
        initialized: true,
        sessionId: session.id,
        projectRoot: session.projectPath,
        projectType: session.projectType,
        currentPhase: session.currentPhase,
        lastUpdated: session.updatedAt,
        status: 'active'
      },
      message: 'TDD脚手架状态正常'
    };
    
  } catch (error) {
    logger.error('获取状态失败:', error);
    
    return {
      success: false,
      error: {
        code: 'STATUS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 导出配置
 */
export async function handleExportConfig(args, sessionManager) {
  const { projectRoot, outputPath } = args;
  
  logger.info(`📤 导出配置: ${projectRoot}`);
  
  try {
    const session = await sessionManager.getOrCreateSession(projectRoot);
    const config = {
      projectRoot,
      sessionId: session?.id,
      configuration: {
        tddEnabled: true,
        version: '2.0.0',
        exportedAt: new Date().toISOString()
      }
    };
    
    const exportFile = outputPath || path.join(projectRoot, '.tdd-config.json');
    await fs.writeJson(exportFile, config, { spaces: 2 });
    
    return {
      success: true,
      data: {
        exportFile,
        exportedAt: config.configuration.exportedAt
      },
      message: `配置已导出到: ${exportFile}`
    };
    
  } catch (error) {
    logger.error('导出配置失败:', error);
    
    return {
      success: false,
      error: {
        code: 'EXPORT_CONFIG_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 导入配置
 */
export async function handleImportConfig(args, sessionManager) {
  const { projectRoot, inputPath } = args;
  
  logger.info(`📥 导入配置: ${projectRoot}`);
  
  try {
    const configFile = inputPath || path.join(projectRoot, '.tdd-config.json');
    
    if (!await fs.pathExists(configFile)) {
      throw new Error(`配置文件不存在: ${configFile}`);
    }
    
    const config = await fs.readJson(configFile);
    
    return {
      success: true,
      data: {
        importedFrom: configFile,
        importedAt: new Date().toISOString()
      },
      message: `配置已从 ${configFile} 导入`
    };
    
  } catch (error) {
    logger.error('导入配置失败:', error);
    
    return {
      success: false,
      error: {
        code: 'IMPORT_CONFIG_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}