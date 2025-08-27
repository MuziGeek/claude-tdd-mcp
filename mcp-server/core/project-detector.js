import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ProjectDetector');

/**
 * 项目类型检测器
 * 负责自动识别项目类型、技术栈、测试框架等
 */
export class ProjectDetector {
  constructor() {
    this.initializeDetectors();
  }

  /**
   * 初始化检测器规则
   */
  initializeDetectors() {
    this.detectors = {
      // 项目类型检测
      projectTypes: {
        'java': {
          files: ['pom.xml', 'build.gradle', 'gradle.properties'],
          directories: ['src/main/java', 'src/test/java'],
          priority: 1
        },
        'javascript': {
          files: ['package.json'],
          directories: ['src', 'lib'],
          priority: 1
        },
        'typescript': {
          files: ['tsconfig.json', 'package.json'],
          extensions: ['.ts', '.tsx'],
          priority: 2
        },
        'python': {
          files: ['requirements.txt', 'setup.py', 'pyproject.toml', 'Pipfile'],
          extensions: ['.py'],
          directories: ['src', 'tests'],
          priority: 1
        },
        'go': {
          files: ['go.mod', 'go.sum'],
          extensions: ['.go'],
          directories: ['cmd', 'pkg', 'internal'],
          priority: 1
        },
        'rust': {
          files: ['Cargo.toml', 'Cargo.lock'],
          extensions: ['.rs'],
          directories: ['src'],
          priority: 1
        },
        'csharp': {
          files: ['*.csproj', '*.sln'],
          extensions: ['.cs'],
          directories: ['src'],
          priority: 1
        }
      },

      // 框架检测
      frameworks: {
        'spring-boot': {
          indicators: ['@SpringBootApplication', 'spring-boot-starter'],
          files: ['pom.xml', 'build.gradle'],
          type: 'java'
        },
        'spring-mvc': {
          indicators: ['@Controller', 'spring-webmvc'],
          files: ['pom.xml', 'build.gradle'],
          type: 'java'
        },
        'react': {
          indicators: ['"react":', 'react-scripts'],
          files: ['package.json'],
          type: 'javascript'
        },
        'vue': {
          indicators: ['"vue":', 'vue-cli-service'],
          files: ['package.json'],
          type: 'javascript'
        },
        'angular': {
          indicators: ['"@angular/core":', '@angular/cli'],
          files: ['package.json'],
          type: 'javascript'
        },
        'express': {
          indicators: ['"express":', 'express'],
          files: ['package.json'],
          type: 'javascript'
        },
        'django': {
          indicators: ['Django', 'django'],
          files: ['requirements.txt', 'setup.py'],
          type: 'python'
        },
        'flask': {
          indicators: ['Flask', 'flask'],
          files: ['requirements.txt', 'setup.py'],
          type: 'python'
        },
        'gin': {
          indicators: ['github.com/gin-gonic/gin'],
          files: ['go.mod'],
          type: 'go'
        },
        'actix-web': {
          indicators: ['actix-web'],
          files: ['Cargo.toml'],
          type: 'rust'
        }
      },

      // 测试框架检测
      testFrameworks: {
        // Java
        'junit5': {
          indicators: ['junit-jupiter', '@Test', 'org.junit.jupiter'],
          files: ['pom.xml', 'build.gradle', '**/*Test.java'],
          type: 'java'
        },
        'junit4': {
          indicators: ['junit:junit', '@Test', 'org.junit.Test'],
          files: ['pom.xml', 'build.gradle', '**/*Test.java'],
          type: 'java'
        },
        'testng': {
          indicators: ['testng', '@Test', 'org.testng'],
          files: ['pom.xml', 'build.gradle'],
          type: 'java'
        },
        'mockito': {
          indicators: ['mockito-core', '@Mock', 'Mockito'],
          files: ['pom.xml', 'build.gradle'],
          type: 'java'
        },

        // JavaScript/TypeScript
        'jest': {
          indicators: ['"jest":', 'jest.config'],
          files: ['package.json', 'jest.config.js'],
          type: 'javascript'
        },
        'mocha': {
          indicators: ['"mocha":', 'mocha.opts'],
          files: ['package.json', 'test/mocha.opts'],
          type: 'javascript'
        },
        'jasmine': {
          indicators: ['"jasmine":', 'jasmine.json'],
          files: ['package.json', 'spec/support/jasmine.json'],
          type: 'javascript'
        },
        'vitest': {
          indicators: ['"vitest":', 'vitest.config'],
          files: ['package.json', 'vitest.config.ts'],
          type: 'javascript'
        },

        // Python
        'pytest': {
          indicators: ['pytest', 'conftest.py'],
          files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
          type: 'python'
        },
        'unittest': {
          indicators: ['unittest', 'test_*.py'],
          files: ['**/*test*.py'],
          type: 'python'
        },

        // Go
        'go-test': {
          indicators: ['testing', '_test.go'],
          files: ['**/*_test.go'],
          type: 'go'
        },

        // Rust
        'cargo-test': {
          indicators: ['#[test]', '#[cfg(test)]'],
          files: ['**/*.rs'],
          type: 'rust'
        }
      },

      // 构建工具检测
      buildTools: {
        'maven': {
          files: ['pom.xml'],
          commands: ['mvn', 'mvn.cmd'],
          type: 'java'
        },
        'gradle': {
          files: ['build.gradle', 'gradle.properties', 'gradlew'],
          commands: ['gradle', 'gradlew'],
          type: 'java'
        },
        'npm': {
          files: ['package.json'],
          commands: ['npm'],
          type: 'javascript'
        },
        'yarn': {
          files: ['package.json', 'yarn.lock'],
          commands: ['yarn'],
          type: 'javascript'
        },
        'pnpm': {
          files: ['package.json', 'pnpm-lock.yaml'],
          commands: ['pnpm'],
          type: 'javascript'
        },
        'pip': {
          files: ['requirements.txt', 'setup.py'],
          commands: ['pip'],
          type: 'python'
        },
        'poetry': {
          files: ['pyproject.toml', 'poetry.lock'],
          commands: ['poetry'],
          type: 'python'
        },
        'go-build': {
          files: ['go.mod'],
          commands: ['go'],
          type: 'go'
        },
        'cargo': {
          files: ['Cargo.toml'],
          commands: ['cargo'],
          type: 'rust'
        },
        'dotnet': {
          files: ['*.csproj', '*.sln'],
          commands: ['dotnet'],
          type: 'csharp'
        }
      }
    };
  }

  /**
   * 检测项目信息
   */
  async detectProject(projectRoot) {
    logger.info(`🔍 开始检测项目: ${projectRoot}`);

    try {
      const projectInfo = {
        root: projectRoot,
        type: 'unknown',
        language: 'unknown',
        framework: [],
        testFramework: [],
        buildTool: 'unknown',
        structure: {},
        configuration: {},
        suggestions: []
      };

      // 并行检测各种信息
      const [
        projectType,
        frameworks,
        testFrameworks,
        buildTools,
        structure
      ] = await Promise.all([
        this.detectProjectType(projectRoot),
        this.detectFrameworks(projectRoot),
        this.detectTestFrameworks(projectRoot),
        this.detectBuildTools(projectRoot),
        this.analyzeProjectStructure(projectRoot)
      ]);

      projectInfo.type = projectType.type;
      projectInfo.language = projectType.language;
      projectInfo.framework = frameworks;
      projectInfo.testFramework = testFrameworks;
      projectInfo.buildTool = buildTools.primary;
      projectInfo.buildTools = buildTools.all;
      projectInfo.structure = structure;

      // 生成配置建议
      projectInfo.configuration = await this.generateConfiguration(projectInfo);
      projectInfo.suggestions = await this.generateSuggestions(projectInfo);

      logger.info(`✅ 项目检测完成: ${projectInfo.type} (${projectInfo.language})`);
      return projectInfo;

    } catch (error) {
      logger.error('项目检测失败:', error);
      throw error;
    }
  }

  /**
   * 检测项目类型
   */
  async detectProjectType(projectRoot) {
    const scores = {};
    
    // 检查每种项目类型
    for (const [type, config] of Object.entries(this.detectors.projectTypes)) {
      let score = 0;

      // 检查特征文件
      if (config.files) {
        for (const file of config.files) {
          if (await this.fileExists(path.join(projectRoot, file))) {
            score += config.priority * 10;
          }
        }
      }

      // 检查特征目录
      if (config.directories) {
        for (const dir of config.directories) {
          if (await this.directoryExists(path.join(projectRoot, dir))) {
            score += config.priority * 5;
          }
        }
      }

      // 检查文件扩展名
      if (config.extensions) {
        const files = await glob(`**/*{${config.extensions.join(',')}}`, {
          cwd: projectRoot,
          ignore: ['node_modules/**', 'target/**', 'build/**', '.git/**']
        });
        if (files.length > 0) {
          score += Math.min(files.length, 20) * config.priority;
        }
      }

      if (score > 0) {
        scores[type] = score;
      }
    }

    // 返回得分最高的类型
    const sortedTypes = Object.entries(scores)
      .sort(([,a], [,b]) => b - a);

    if (sortedTypes.length === 0) {
      return { type: 'unknown', language: 'unknown', confidence: 0 };
    }

    const [bestType, bestScore] = sortedTypes[0];
    const confidence = Math.min(bestScore / 50, 1); // 标准化到0-1

    return {
      type: bestType,
      language: bestType,
      confidence,
      alternatives: sortedTypes.slice(1, 3).map(([type, score]) => ({
        type,
        confidence: Math.min(score / 50, 1)
      }))
    };
  }

  /**
   * 检测框架
   */
  async detectFrameworks(projectRoot) {
    const detectedFrameworks = [];

    for (const [framework, config] of Object.entries(this.detectors.frameworks)) {
      let detected = false;

      // 检查指示文件中的内容
      if (config.files) {
        for (const file of config.files) {
          try {
            const filePath = path.join(projectRoot, file);
            if (await fs.pathExists(filePath)) {
              const content = await fs.readFile(filePath, 'utf-8');
              
              // 检查指示符
              if (config.indicators.some(indicator => content.includes(indicator))) {
                detected = true;
                break;
              }
            }
          } catch (error) {
            // 忽略读取错误
          }
        }
      }

      if (detected) {
        detectedFrameworks.push({
          name: framework,
          type: config.type,
          confidence: 0.8
        });
      }
    }

    return detectedFrameworks;
  }

  /**
   * 检测测试框架
   */
  async detectTestFrameworks(projectRoot) {
    const detectedFrameworks = [];

    for (const [framework, config] of Object.entries(this.detectors.testFrameworks)) {
      let detected = false;

      // 检查指示文件
      if (config.files) {
        for (const filePattern of config.files) {
          try {
            const files = await glob(filePattern, {
              cwd: projectRoot,
              ignore: ['node_modules/**', 'target/**', 'build/**']
            });

            if (files.length > 0) {
              // 对于代码文件，检查内容
              if (filePattern.includes('*')) {
                for (const file of files.slice(0, 5)) { // 只检查前5个文件
                  const content = await fs.readFile(path.join(projectRoot, file), 'utf-8');
                  if (config.indicators.some(indicator => content.includes(indicator))) {
                    detected = true;
                    break;
                  }
                }
              } else {
                // 对于配置文件，检查是否存在
                const filePath = path.join(projectRoot, filePattern);
                if (await fs.pathExists(filePath)) {
                  const content = await fs.readFile(filePath, 'utf-8');
                  if (config.indicators.some(indicator => content.includes(indicator))) {
                    detected = true;
                  }
                }
              }
            }
          } catch (error) {
            // 忽略错误
          }

          if (detected) break;
        }
      }

      if (detected) {
        detectedFrameworks.push({
          name: framework,
          type: config.type,
          confidence: 0.9
        });
      }
    }

    return detectedFrameworks;
  }

  /**
   * 检测构建工具
   */
  async detectBuildTools(projectRoot) {
    const detectedTools = [];

    for (const [tool, config] of Object.entries(this.detectors.buildTools)) {
      let detected = false;

      // 检查特征文件
      if (config.files) {
        for (const filePattern of config.files) {
          try {
            if (filePattern.includes('*')) {
              const files = await glob(filePattern, {
                cwd: projectRoot,
                maxDepth: 1
              });
              if (files.length > 0) {
                detected = true;
                break;
              }
            } else {
              const filePath = path.join(projectRoot, filePattern);
              if (await fs.pathExists(filePath)) {
                detected = true;
                break;
              }
            }
          } catch (error) {
            // 忽略错误
          }
        }
      }

      if (detected) {
        detectedTools.push({
          name: tool,
          type: config.type,
          commands: config.commands,
          confidence: 0.9
        });
      }
    }

    // 选择主要构建工具
    const primary = detectedTools.length > 0 ? detectedTools[0].name : 'unknown';

    return {
      primary,
      all: detectedTools
    };
  }

  /**
   * 分析项目结构
   */
  async analyzeProjectStructure(projectRoot) {
    try {
      const structure = {
        hasSource: false,
        hasTests: false,
        sourceDir: [],
        testDir: [],
        configFiles: [],
        testCoverage: 0,
        complexity: 'simple'
      };

      // 常见源码目录
      const sourceDirs = ['src', 'lib', 'app', 'source'];
      const testDirs = ['test', 'tests', '__tests__', 'spec'];

      // 检查源码目录
      for (const dir of sourceDirs) {
        const dirPath = path.join(projectRoot, dir);
        if (await fs.pathExists(dirPath)) {
          structure.hasSource = true;
          structure.sourceDir.push(dir);
        }
      }

      // 检查测试目录
      for (const dir of testDirs) {
        const dirPath = path.join(projectRoot, dir);
        if (await fs.pathExists(dirPath)) {
          structure.hasTests = true;
          structure.testDir.push(dir);
        }
      }

      // 检查Java项目的特殊结构
      const javaMainDir = path.join(projectRoot, 'src/main/java');
      const javaTestDir = path.join(projectRoot, 'src/test/java');
      if (await fs.pathExists(javaMainDir)) {
        structure.hasSource = true;
        structure.sourceDir.push('src/main/java');
      }
      if (await fs.pathExists(javaTestDir)) {
        structure.hasTests = true;
        structure.testDir.push('src/test/java');
      }

      // 统计文件数量评估复杂度
      const allFiles = await glob('**/*', {
        cwd: projectRoot,
        ignore: ['node_modules/**', 'target/**', 'build/**', '.git/**'],
        nodir: true
      });

      if (allFiles.length > 200) {
        structure.complexity = 'complex';
      } else if (allFiles.length > 50) {
        structure.complexity = 'medium';
      }

      // 粗略计算测试覆盖率（基于文件数量）
      const sourceFiles = allFiles.filter(file => 
        !file.includes('test') && 
        (file.endsWith('.java') || file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.py'))
      );
      const testFiles = allFiles.filter(file => 
        file.includes('test') || file.includes('spec')
      );

      if (sourceFiles.length > 0) {
        structure.testCoverage = Math.min(Math.round((testFiles.length / sourceFiles.length) * 100), 100);
      }

      return structure;

    } catch (error) {
      logger.error('分析项目结构失败:', error);
      return {
        hasSource: false,
        hasTests: false,
        sourceDir: [],
        testDir: [],
        configFiles: [],
        testCoverage: 0,
        complexity: 'unknown'
      };
    }
  }

  /**
   * 生成配置建议
   */
  async generateConfiguration(projectInfo) {
    const config = {
      testCommand: 'unknown',
      buildCommand: 'unknown',
      watchPattern: ['**/*.js', '**/*.java', '**/*.py'],
      testPattern: [],
      recommendedTools: []
    };

    // 根据构建工具生成命令
    switch (projectInfo.buildTool) {
      case 'maven':
        config.testCommand = 'mvn test';
        config.buildCommand = 'mvn compile';
        config.watchPattern = ['src/**/*.java'];
        config.testPattern = ['src/test/**/*Test.java'];
        break;

      case 'gradle':
        config.testCommand = 'gradle test';
        config.buildCommand = 'gradle build';
        config.watchPattern = ['src/**/*.java'];
        config.testPattern = ['src/test/**/*Test.java'];
        break;

      case 'npm':
        config.testCommand = 'npm test';
        config.buildCommand = 'npm run build';
        config.watchPattern = ['src/**/*.js', 'src/**/*.ts'];
        config.testPattern = ['**/*.test.js', '**/*.spec.js'];
        break;

      case 'yarn':
        config.testCommand = 'yarn test';
        config.buildCommand = 'yarn build';
        config.watchPattern = ['src/**/*.js', 'src/**/*.ts'];
        config.testPattern = ['**/*.test.js', '**/*.spec.js'];
        break;

      case 'pnpm':
        config.testCommand = 'pnpm test';
        config.buildCommand = 'pnpm build';
        config.watchPattern = ['src/**/*.js', 'src/**/*.ts'];
        config.testPattern = ['**/*.test.js', '**/*.spec.js'];
        break;

      case 'pip':
        config.testCommand = 'python -m pytest';
        config.buildCommand = 'python setup.py build';
        config.watchPattern = ['**/*.py'];
        config.testPattern = ['**/test_*.py', '**/*_test.py'];
        break;

      case 'poetry':
        config.testCommand = 'poetry run pytest';
        config.buildCommand = 'poetry build';
        config.watchPattern = ['**/*.py'];
        config.testPattern = ['**/test_*.py', '**/*_test.py'];
        break;

      case 'go-build':
        config.testCommand = 'go test ./...';
        config.buildCommand = 'go build';
        config.watchPattern = ['**/*.go'];
        config.testPattern = ['**/*_test.go'];
        break;

      case 'cargo':
        config.testCommand = 'cargo test';
        config.buildCommand = 'cargo build';
        config.watchPattern = ['src/**/*.rs'];
        config.testPattern = ['src/**/*.rs'];
        break;
    }

    // 推荐工具
    if (!projectInfo.structure.hasTests) {
      config.recommendedTools.push('测试框架配置');
    }
    if (projectInfo.structure.testCoverage < 30) {
      config.recommendedTools.push('测试覆盖率工具');
    }
    if (!projectInfo.testFramework.length) {
      config.recommendedTools.push('测试框架安装');
    }

    return config;
  }

  /**
   * 生成改进建议
   */
  async generateSuggestions(projectInfo) {
    const suggestions = [];

    // 测试相关建议
    if (!projectInfo.structure.hasTests) {
      suggestions.push({
        type: 'critical',
        category: 'testing',
        title: '缺少测试目录',
        description: '项目没有测试目录，建议创建测试结构',
        action: 'create_test_structure'
      });
    }

    if (projectInfo.testFramework.length === 0) {
      suggestions.push({
        type: 'important',
        category: 'testing',
        title: '缺少测试框架',
        description: '未检测到测试框架，建议配置适当的测试工具',
        action: 'setup_test_framework'
      });
    }

    if (projectInfo.structure.testCoverage < 50) {
      suggestions.push({
        type: 'improvement',
        category: 'quality',
        title: '测试覆盖率偏低',
        description: `当前测试覆盖率约${projectInfo.structure.testCoverage}%，建议提高到70%以上`,
        action: 'improve_coverage'
      });
    }

    // 结构建议
    if (projectInfo.structure.complexity === 'complex' && !projectInfo.structure.hasSource) {
      suggestions.push({
        type: 'important',
        category: 'structure',
        title: '项目结构混乱',
        description: '复杂项目建议采用标准目录结构',
        action: 'restructure_project'
      });
    }

    // TDD工作流建议
    if (projectInfo.configuration.testCommand === 'unknown') {
      suggestions.push({
        type: 'critical',
        category: 'workflow',
        title: '无法识别测试命令',
        description: '需要手动配置测试运行命令',
        action: 'configure_test_command'
      });
    }

    return suggestions;
  }

  /**
   * 辅助方法：检查文件是否存在
   */
  async fileExists(filePath) {
    try {
      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  /**
   * 辅助方法：检查目录是否存在
   */
  async directoryExists(dirPath) {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}