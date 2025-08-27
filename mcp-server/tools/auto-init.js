import { createLogger } from '../utils/logger.js';
import { AutoConfigurator } from '../core/auto-configurator.js';
import { ProjectDetector } from '../core/project-detector.js';

const logger = createLogger('AutoInit');

// 全局自动配置器实例
let globalAutoConfigurator = null;
let globalProjectDetector = null;

/**
 * 获取或创建自动配置器实例
 */
function getAutoConfigurator(sessionManager) {
  if (!globalAutoConfigurator) {
    globalAutoConfigurator = new AutoConfigurator(sessionManager);
  }
  return globalAutoConfigurator;
}

/**
 * 获取或创建项目检测器实例
 */
function getProjectDetector() {
  if (!globalProjectDetector) {
    globalProjectDetector = new ProjectDetector();
  }
  return globalProjectDetector;
}

/**
 * 自动初始化项目
 */
export async function handleAutoInitProject(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🚀 自动初始化项目: ${projectRoot}`);
  
  try {
    const autoConfigurator = getAutoConfigurator(sessionManager);
    const result = await autoConfigurator.autoConfigureProject(projectRoot);
    
    if (result.success) {
      logger.info(`✅ 自动初始化完成: ${result.configuration.projectType}`);
    } else {
      logger.error('自动初始化失败:', result.error);
    }
    
    return result;
    
  } catch (error) {
    logger.error('自动初始化项目失败:', error);
    
    return {
      success: false,
      error: {
        code: 'AUTO_INIT_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 检测项目类型和配置
 */
export async function handleDetectProject(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🔍 检测项目: ${projectRoot}`);
  
  try {
    const projectDetector = getProjectDetector();
    const projectInfo = await projectDetector.detectProject(projectRoot);
    
    logger.info(`✅ 项目检测完成: ${projectInfo.type} (${projectInfo.language})`);
    
    return {
      success: true,
      data: projectInfo,
      message: `检测到 ${projectInfo.type} 项目，使用 ${projectInfo.buildTool} 构建工具`
    };
    
  } catch (error) {
    logger.error('检测项目失败:', error);
    
    return {
      success: false,
      error: {
        code: 'DETECT_PROJECT_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 生成项目配置建议
 */
export async function handleGenerateConfigSuggestions(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`💡 生成配置建议: ${projectRoot}`);
  
  try {
    const projectDetector = getProjectDetector();
    const autoConfigurator = getAutoConfigurator(sessionManager);
    
    // 检测项目信息
    const projectInfo = await projectDetector.detectProject(projectRoot);
    
    // 生成配置
    const configuration = await autoConfigurator.generateConfiguration(projectInfo);
    
    // 验证配置
    const validation = await autoConfigurator.validateConfiguration(projectRoot, configuration);
    
    const suggestions = {
      projectInfo,
      recommendedConfiguration: configuration,
      validationIssues: validation.issues,
      quickActions: generateQuickActions(projectInfo, configuration),
      setupSteps: generateSetupSteps(projectInfo, configuration)
    };
    
    logger.info(`✅ 配置建议生成完成`);
    
    return {
      success: true,
      data: suggestions,
      message: '配置建议已生成，可根据建议优化项目设置'
    };
    
  } catch (error) {
    logger.error('生成配置建议失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GENERATE_SUGGESTIONS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 应用推荐配置
 */
export async function handleApplyRecommendedConfig(args, sessionManager) {
  const { projectRoot, configOptions = {} } = args;
  
  logger.info(`⚙️ 应用推荐配置: ${projectRoot}`);
  
  try {
    const autoConfigurator = getAutoConfigurator(sessionManager);
    
    // 自动配置项目（这会完整配置项目）
    const result = await autoConfigurator.autoConfigureProject(projectRoot);
    
    if (result.success) {
      // 如果有自定义选项，应用它们
      if (Object.keys(configOptions).length > 0) {
        const updatedConfig = await applyCustomOptions(
          projectRoot, 
          result.configuration, 
          configOptions,
          sessionManager
        );
        result.configuration = updatedConfig;
      }
      
      logger.info(`✅ 推荐配置应用成功`);
    } else {
      logger.error('应用推荐配置失败:', result.error);
    }
    
    return result;
    
  } catch (error) {
    logger.error('应用推荐配置失败:', error);
    
    return {
      success: false,
      error: {
        code: 'APPLY_CONFIG_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 验证项目配置
 */
export async function handleValidateProjectConfig(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🔎 验证项目配置: ${projectRoot}`);
  
  try {
    const autoConfigurator = getAutoConfigurator(sessionManager);
    const projectDetector = getProjectDetector();
    
    // 获取当前项目信息
    const projectInfo = await projectDetector.detectProject(projectRoot);
    
    // 生成理想配置
    const idealConfig = await autoConfigurator.generateConfiguration(projectInfo);
    
    // 验证当前配置
    const validation = await autoConfigurator.validateConfiguration(projectRoot, idealConfig);
    
    // 检查现有配置文件
    const configStatus = await checkExistingConfig(projectRoot);
    
    const validationResult = {
      isValid: validation.valid,
      issues: validation.issues,
      configurationStatus: configStatus,
      recommendations: generateValidationRecommendations(validation.issues, configStatus),
      score: calculateConfigurationScore(validation.issues, configStatus)
    };
    
    logger.info(`✅ 配置验证完成, 得分: ${validationResult.score}/100`);
    
    return {
      success: true,
      data: validationResult,
      message: `配置验证完成，配置健康度: ${validationResult.score}/100`
    };
    
  } catch (error) {
    logger.error('验证项目配置失败:', error);
    
    return {
      success: false,
      error: {
        code: 'VALIDATE_CONFIG_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 获取初始化状态
 */
export async function handleGetInitStatus(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`📊 获取初始化状态: ${projectRoot}`);
  
  try {
    const projectDetector = getProjectDetector();
    
    // 检测项目基本信息
    const projectInfo = await projectDetector.detectProject(projectRoot);
    
    // 检查配置状态
    const configStatus = await checkExistingConfig(projectRoot);
    
    // 检查TDD状态
    const currentState = await sessionManager.getState(projectRoot);
    
    const initStatus = {
      projectDetected: projectInfo.type !== 'unknown',
      projectInfo,
      configurationExists: configStatus.hasTddConfig,
      configurationValid: configStatus.isValid,
      tddStateInitialized: currentState?.feature !== undefined,
      autoConfigured: currentState?.autoConfigured || false,
      readyForTdd: projectInfo.type !== 'unknown' && 
                   projectInfo.structure.hasTests && 
                   projectInfo.testFramework.length > 0,
      suggestions: generateInitSuggestions(projectInfo, configStatus, currentState)
    };
    
    logger.info(`✅ 初始化状态获取完成`);
    
    return {
      success: true,
      data: initStatus,
      message: getInitStatusMessage(initStatus)
    };
    
  } catch (error) {
    logger.error('获取初始化状态失败:', error);
    
    return {
      success: false,
      error: {
        code: 'GET_INIT_STATUS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 生成快捷操作
 */
function generateQuickActions(projectInfo, configuration) {
  const actions = [];

  if (!projectInfo.structure.hasTests) {
    actions.push({
      id: 'create_test_structure',
      title: '创建测试结构',
      description: '创建标准的测试目录和示例测试',
      command: 'tdd_auto_init_project'
    });
  }

  if (projectInfo.testFramework.length === 0) {
    actions.push({
      id: 'setup_test_framework',
      title: '配置测试框架',
      description: '安装和配置适合的测试框架',
      command: 'tdd_apply_recommended_config'
    });
  }

  if (projectInfo.structure.testCoverage < 30) {
    actions.push({
      id: 'improve_coverage',
      title: '提升测试覆盖率',
      description: '添加更多测试用例提高覆盖率',
      command: 'tdd_create_feature'
    });
  }

  actions.push({
    id: 'start_tdd',
    title: '开始TDD',
    description: '创建第一个功能并开始TDD流程',
    command: 'tdd_create_feature'
  });

  return actions;
}

/**
 * 生成设置步骤
 */
function generateSetupSteps(projectInfo, configuration) {
  const steps = [];

  steps.push({
    step: 1,
    title: '项目检测',
    description: `已检测到 ${projectInfo.type} 项目`,
    completed: true
  });

  if (!projectInfo.structure.hasTests) {
    steps.push({
      step: 2,
      title: '创建测试结构',
      description: '创建测试目录和基础测试文件',
      action: 'create_test_structure',
      completed: false
    });
  }

  if (projectInfo.testFramework.length === 0) {
    steps.push({
      step: 3,
      title: '配置测试框架',
      description: '安装和配置测试框架',
      action: 'setup_test_framework',
      completed: false
    });
  }

  steps.push({
    step: steps.length + 1,
    title: '应用TDD配置',
    description: '生成TDD工作流配置文件',
    action: 'apply_tdd_config',
    completed: false
  });

  steps.push({
    step: steps.length + 1,
    title: '开始TDD',
    description: '创建第一个功能开始TDD流程',
    action: 'start_first_feature',
    completed: false
  });

  return steps;
}

/**
 * 应用自定义选项
 */
async function applyCustomOptions(projectRoot, configuration, options, sessionManager) {
  // 合并自定义选项
  const updatedConfig = {
    ...configuration,
    ...options
  };

  // 如果有命令自定义，更新命令配置
  if (options.commands) {
    updatedConfig.commands = {
      ...configuration.commands,
      ...options.commands
    };
  }

  // 如果有模式自定义，更新模式配置
  if (options.patterns) {
    updatedConfig.patterns = {
      ...configuration.patterns,
      ...options.patterns
    };
  }

  // 更新会话状态
  const currentState = await sessionManager.getState(projectRoot);
  await sessionManager.setState(projectRoot, {
    ...currentState,
    configuration: updatedConfig
  });

  return updatedConfig;
}

/**
 * 检查现有配置
 */
async function checkExistingConfig(projectRoot) {
  const fs = await import('fs-extra');
  const path = await import('path');

  const configPath = path.join(projectRoot, '.tdd-config.json');
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const pomPath = path.join(projectRoot, 'pom.xml');

  const status = {
    hasTddConfig: await fs.pathExists(configPath),
    hasPackageJson: await fs.pathExists(packageJsonPath),
    hasPomXml: await fs.pathExists(pomPath),
    isValid: true
  };

  // 如果有TDD配置文件，验证其有效性
  if (status.hasTddConfig) {
    try {
      const config = await fs.readJson(configPath);
      status.isValid = config.projectType && config.commands && config.patterns;
      status.tddConfig = config;
    } catch (error) {
      status.isValid = false;
    }
  }

  return status;
}

/**
 * 生成验证建议
 */
function generateValidationRecommendations(issues, configStatus) {
  const recommendations = [];

  issues.forEach(issue => {
    recommendations.push({
      type: issue.severity,
      message: issue.message,
      suggestion: issue.suggestion,
      action: issue.message.includes('测试命令') ? 'fix_test_command' : 
              issue.message.includes('测试目录') ? 'create_test_structure' : 'general_fix'
    });
  });

  if (!configStatus.hasTddConfig) {
    recommendations.push({
      type: 'info',
      message: '未找到TDD配置文件',
      suggestion: '运行自动初始化生成配置文件',
      action: 'auto_init'
    });
  }

  return recommendations;
}

/**
 * 计算配置评分
 */
function calculateConfigurationScore(issues, configStatus) {
  let score = 100;

  // 扣分项
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'error':
        score -= 30;
        break;
      case 'warning':
        score -= 15;
        break;
      case 'info':
        score -= 5;
        break;
    }
  });

  // 额外奖励项
  if (configStatus.hasTddConfig) {
    score += 10;
  }
  if (configStatus.isValid) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 生成初始化建议
 */
function generateInitSuggestions(projectInfo, configStatus, currentState) {
  const suggestions = [];

  if (projectInfo.type === 'unknown') {
    suggestions.push('🔍 项目类型未知，可能需要手动配置');
  }

  if (!projectInfo.structure.hasTests) {
    suggestions.push('📝 创建测试目录以支持TDD工作流');
  }

  if (projectInfo.testFramework.length === 0) {
    suggestions.push('🔧 配置合适的测试框架');
  }

  if (!configStatus.hasTddConfig) {
    suggestions.push('⚙️ 生成TDD配置文件');
  }

  if (!currentState || !currentState.feature) {
    suggestions.push('🎯 创建第一个功能开始TDD');
  }

  return suggestions;
}

/**
 * 获取初始化状态消息
 */
function getInitStatusMessage(initStatus) {
  if (initStatus.readyForTdd) {
    return '项目已准备就绪，可以开始TDD开发';
  } else if (initStatus.projectDetected) {
    return `${initStatus.projectInfo.type} 项目已检测，需要完成初始化配置`;
  } else {
    return '需要手动配置项目类型和测试环境';
  }
}