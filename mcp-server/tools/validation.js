import { createLogger } from '../utils/logger.js';
import fs from 'fs-extra';
import path from 'path';

const logger = createLogger('Validation');

/**
 * 处理环境验证
 */
export async function handleValidateEnvironment(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🔍 验证环境: ${projectRoot}`);
  
  try {
    const validation = {
      projectExists: await fs.pathExists(projectRoot),
      hasClaudeConfig: await fs.pathExists(path.join(projectRoot, '.claude')),
      hasTDDSession: await fs.pathExists(path.join(projectRoot, '.tdd-session.json')),
      buildTools: await validateBuildTools(projectRoot),
      testFrameworks: await validateTestFrameworks(projectRoot)
    };
    
    const issues = [];
    const recommendations = [];
    
    if (!validation.projectExists) {
      issues.push('项目目录不存在');
    }
    
    if (!validation.hasClaudeConfig) {
      recommendations.push('建议运行 tdd_initialize 初始化项目');
    }
    
    if (!validation.hasTDDSession) {
      recommendations.push('建议创建TDD会话');
    }
    
    const isValid = issues.length === 0;
    
    logger.info(`✅ 环境验证完成: ${isValid ? '通过' : '有问题'}`);
    
    return {
      success: true,
      data: {
        validation,
        isValid,
        issues,
        recommendations,
        validatedAt: new Date().toISOString()
      },
      message: isValid ? '环境验证通过' : `发现 ${issues.length} 个问题`
    };
    
  } catch (error) {
    logger.error('环境验证失败:', error);
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

async function validateBuildTools(projectRoot) {
  const buildTools = {
    maven: await fs.pathExists(path.join(projectRoot, 'pom.xml')),
    gradle: await fs.pathExists(path.join(projectRoot, 'build.gradle')),
    npm: await fs.pathExists(path.join(projectRoot, 'package.json')),
    pip: await fs.pathExists(path.join(projectRoot, 'requirements.txt'))
  };
  
  return buildTools;
}

async function validateTestFrameworks(projectRoot) {
  const testFrameworks = {
    junit: false,
    jest: false,
    pytest: false
  };
  
  try {
    // 检查Maven项目中的JUnit
    const pomPath = path.join(projectRoot, 'pom.xml');
    if (await fs.pathExists(pomPath)) {
      const pomContent = await fs.readFile(pomPath, 'utf8');
      testFrameworks.junit = pomContent.includes('junit');
    }
    
    // 检查Node项目中的Jest
    const packagePath = path.join(projectRoot, 'package.json');
    if (await fs.pathExists(packagePath)) {
      const pkg = await fs.readJson(packagePath);
      testFrameworks.jest = !!(pkg.devDependencies && pkg.devDependencies.jest);
    }
    
    // 检查Python项目中的pytest
    const reqPath = path.join(projectRoot, 'requirements.txt');
    if (await fs.pathExists(reqPath)) {
      const reqContent = await fs.readFile(reqPath, 'utf8');
      testFrameworks.pytest = reqContent.includes('pytest');
    }
  } catch (error) {
    // 忽略错误
  }
  
  return testFrameworks;
}