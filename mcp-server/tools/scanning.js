import path from 'path';
import fs from 'fs-extra';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Scanning');

/**
 * 简化的项目扫描器
 */
class SimpleProjectScanner {
  async scanProject(projectRoot, deep = false) {
    const analysis = {
      name: path.basename(projectRoot),
      path: projectRoot,
      type: await this.detectProjectType(projectRoot),
      framework: null,
      buildTool: null,
      testFramework: null,
      modules: [],
      dependencies: [],
      sourceFiles: [],
      testFiles: []
    };

    // 检测构建工具
    analysis.buildTool = await this.detectBuildTool(projectRoot);
    
    // 检测测试框架
    analysis.testFramework = await this.detectTestFramework(projectRoot);
    
    if (deep) {
      // 深度分析：扫描源文件
      await this.scanSourceFiles(projectRoot, analysis);
    }
    
    return analysis;
  }
  
  async detectProjectType(projectRoot) {
    const pomXml = path.join(projectRoot, 'pom.xml');
    const packageJson = path.join(projectRoot, 'package.json');
    const requirementsTxt = path.join(projectRoot, 'requirements.txt');
    const buildGradle = path.join(projectRoot, 'build.gradle');
    
    if (await fs.pathExists(pomXml)) {
      const content = await fs.readFile(pomXml, 'utf8');
      if (content.includes('spring-boot')) {
        return 'java-spring-boot';
      }
      return 'java-maven';
    }
    
    if (await fs.pathExists(buildGradle)) {
      return 'java-gradle';
    }
    
    if (await fs.pathExists(packageJson)) {
      const pkg = await fs.readJson(packageJson);
      if (pkg.dependencies) {
        if (pkg.dependencies.express) return 'node-express';
        if (pkg.dependencies.react) return 'react';
        if (pkg.dependencies.vue) return 'vue';
      }
      return 'nodejs';
    }
    
    if (await fs.pathExists(requirementsTxt)) {
      const content = await fs.readFile(requirementsTxt, 'utf8');
      if (content.includes('Django')) return 'python-django';
      if (content.includes('Flask')) return 'python-flask';
      return 'python';
    }
    
    return 'generic';
  }
  
  async detectBuildTool(projectRoot) {
    if (await fs.pathExists(path.join(projectRoot, 'pom.xml'))) {
      return 'maven';
    }
    if (await fs.pathExists(path.join(projectRoot, 'build.gradle'))) {
      return 'gradle';
    }
    if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
      return 'npm';
    }
    if (await fs.pathExists(path.join(projectRoot, 'requirements.txt'))) {
      return 'pip';
    }
    return null;
  }
  
  async detectTestFramework(projectRoot) {
    try {
      if (await fs.pathExists(path.join(projectRoot, 'pom.xml'))) {
        const pomContent = await fs.readFile(path.join(projectRoot, 'pom.xml'), 'utf8');
        if (pomContent.includes('junit-jupiter')) return 'junit5';
        if (pomContent.includes('junit')) return 'junit4';
      }
      
      if (await fs.pathExists(path.join(projectRoot, 'package.json'))) {
        const pkg = await fs.readJson(path.join(projectRoot, 'package.json'));
        if (pkg.devDependencies) {
          if (pkg.devDependencies.jest) return 'jest';
          if (pkg.devDependencies.mocha) return 'mocha';
          if (pkg.devDependencies.vitest) return 'vitest';
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  async scanSourceFiles(projectRoot, analysis) {
    const srcDirs = [
      path.join(projectRoot, 'src'),
      path.join(projectRoot, 'lib'),
      path.join(projectRoot, 'app')
    ];
    
    for (const srcDir of srcDirs) {
      if (await fs.pathExists(srcDir)) {
        await this.scanDirectory(srcDir, analysis, projectRoot);
      }
    }
  }
  
  async scanDirectory(dirPath, analysis, basePath) {
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await this.scanDirectory(fullPath, analysis, basePath);
        } else if (stat.isFile()) {
          const relativePath = path.relative(basePath, fullPath);
          const ext = path.extname(item).toLowerCase();
          
          if (this.isSourceFile(ext)) {
            if (this.isTestFile(relativePath)) {
              analysis.testFiles.push({
                path: relativePath,
                name: item,
                extension: ext
              });
            } else {
              analysis.sourceFiles.push({
                path: relativePath,
                name: item,
                extension: ext
              });
            }
          }
        }
      }
    } catch (error) {
      // 忽略权限错误
    }
  }
  
  isSourceFile(ext) {
    const sourceExts = ['.java', '.js', '.ts', '.py', '.rb', '.go', '.rs', '.php', '.cpp', '.c', '.h'];
    return sourceExts.includes(ext);
  }
  
  isTestFile(filePath) {
    const testPatterns = ['/test/', '/tests/', 'Test.', 'Spec.', '.test.', '.spec.'];
    return testPatterns.some(pattern => filePath.includes(pattern));
  }
}

/**
 * 处理项目扫描
 */
export async function handleScanProject(args, sessionManager) {
  const { projectRoot, deep = false } = args;
  
  logger.info(`🔍 扫描项目: ${projectRoot} (深度: ${deep})`);
  
  try {
    const scanner = new SimpleProjectScanner();
    const analysis = await scanner.scanProject(projectRoot, deep);
    
    // 获取或创建会话
    const session = await sessionManager.getOrCreateSession(projectRoot);
    
    // 更新会话状态
    await sessionManager.updateSession(projectRoot, {
      analysis: {
        ...analysis,
        lastScanned: new Date().toISOString(),
        scanType: deep ? 'deep' : 'basic'
      }
    });
    
    logger.info(`✅ 项目扫描完成: ${analysis.name} (${analysis.type})`);
    
    return {
      success: true,
      data: {
        analysis,
        summary: {
          name: analysis.name,
          type: analysis.type,
          buildTool: analysis.buildTool,
          testFramework: analysis.testFramework,
          sourceFileCount: analysis.sourceFiles?.length || 0,
          testFileCount: analysis.testFiles?.length || 0
        }
      },
      message: `项目扫描完成：发现${analysis.type}项目，包含${analysis.sourceFiles?.length || 0}个源文件`
    };
    
  } catch (error) {
    logger.error('项目扫描失败:', error);
    
    return {
      success: false,
      error: {
        code: 'SCAN_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}

/**
 * 处理深度分析
 */
export async function handleDeepAnalyze(args, sessionManager) {
  const { projectRoot } = args;
  
  logger.info(`🔬 深度分析项目: ${projectRoot}`);
  
  try {
    // 使用简化的深度分析
    const scanner = new SimpleProjectScanner();
    const analysis = await scanner.scanProject(projectRoot, true);
    
    // 添加一些深度分析的信息
    const deepAnalysis = {
      ...analysis,
      architecture: {
        pattern: analysis.type.includes('spring') ? 'MVC' : 'unknown',
        complexity: analysis.sourceFiles.length > 50 ? 'high' : 'medium'
      },
      recommendations: [
        '考虑使用TDD方法开发新功能',
        '保持良好的测试覆盖率',
        '定期重构代码提升质量'
      ]
    };
    
    // 获取会话并更新状态
    const session = await sessionManager.getOrCreateSession(projectRoot);
    await sessionManager.updateSession(projectRoot, {
      deepAnalysis: {
        ...deepAnalysis,
        analyzedAt: new Date().toISOString()
      }
    });
    
    logger.info(`✅ 深度分析完成，生成${deepAnalysis.recommendations?.length || 0}个建议`);
    
    return {
      success: true,
      data: {
        analysis: deepAnalysis,
        summary: {
          architecture: deepAnalysis.architecture,
          sourceFiles: deepAnalysis.sourceFiles.length,
          testFiles: deepAnalysis.testFiles.length,
          recommendations: deepAnalysis.recommendations.length
        }
      },
      message: `深度分析完成：发现${deepAnalysis.recommendations?.length || 0}个优化建议`
    };
    
  } catch (error) {
    logger.error('深度分析失败:', error);
    
    return {
      success: false,
      error: {
        code: 'DEEP_ANALYSIS_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}