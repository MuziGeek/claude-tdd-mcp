import { createLogger } from '../utils/logger.js';

const logger = createLogger('Profiles');

/**
 * 处理配置模板管理
 */
export async function handleManageProfiles(args, sessionManager) {
  const { action, profile, projectRoot } = args;
  
  logger.info(`📋 管理配置模板: ${action} - ${profile}`);
  
  try {
    const availableProfiles = [
      'java-spring',
      'java-maven',
      'node-express',
      'python-django',
      'react',
      'vue',
      'generic'
    ];
    
    switch (action) {
      case 'list':
        return {
          success: true,
          data: {
            profiles: availableProfiles.map(p => ({
              name: p,
              description: getProfileDescription(p),
              supported: true
            }))
          },
          message: `找到 ${availableProfiles.length} 个配置模板`
        };
        
      case 'get':
        if (!availableProfiles.includes(profile)) {
          throw new Error(`未知的配置模板: ${profile}`);
        }
        
        return {
          success: true,
          data: {
            profile: {
              name: profile,
              description: getProfileDescription(profile),
              configuration: getProfileConfiguration(profile)
            }
          },
          message: `获取配置模板: ${profile}`
        };
        
      case 'apply':
        if (!availableProfiles.includes(profile)) {
          throw new Error(`未知的配置模板: ${profile}`);
        }
        
        // 应用配置模板到项目
        const session = await sessionManager.getOrCreateSession(projectRoot);
        await sessionManager.updateSession(projectRoot, {
          profile: profile,
          appliedAt: new Date().toISOString()
        });
        
        return {
          success: true,
          data: {
            profile,
            projectRoot,
            appliedAt: new Date().toISOString()
          },
          message: `已将 ${profile} 配置模板应用到项目`
        };
        
      default:
        throw new Error(`未知的操作: ${action}`);
    }
    
  } catch (error) {
    logger.error('配置模板管理失败:', error);
    
    return {
      success: false,
      error: {
        code: 'PROFILE_MANAGEMENT_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

function getProfileDescription(profile) {
  const descriptions = {
    'java-spring': 'Java Spring Boot 项目配置',
    'java-maven': 'Java Maven 项目配置',
    'node-express': 'Node.js Express 项目配置',
    'python-django': 'Python Django 项目配置',
    'react': 'React 前端项目配置',
    'vue': 'Vue.js 前端项目配置',
    'generic': '通用项目配置'
  };
  
  return descriptions[profile] || '未知配置模板';
}

function getProfileConfiguration(profile) {
  const configurations = {
    'java-spring': {
      buildTool: 'maven',
      testFramework: 'junit5',
      sourceDir: 'src/main/java',
      testDir: 'src/test/java',
      tddPhases: ['RED', 'GREEN', 'REFACTOR']
    },
    'node-express': {
      buildTool: 'npm',
      testFramework: 'jest',
      sourceDir: 'src',
      testDir: 'tests',
      tddPhases: ['RED', 'GREEN', 'REFACTOR']
    },
    'python-django': {
      buildTool: 'pip',
      testFramework: 'pytest',
      sourceDir: 'src',
      testDir: 'tests',
      tddPhases: ['RED', 'GREEN', 'REFACTOR']
    }
  };
  
  return configurations[profile] || {
    buildTool: 'unknown',
    testFramework: 'unknown',
    sourceDir: 'src',
    testDir: 'tests',
    tddPhases: ['RED', 'GREEN', 'REFACTOR']
  };
}