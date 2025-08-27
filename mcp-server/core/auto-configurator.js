import fs from 'fs-extra';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { ProjectDetector } from './project-detector.js';

const logger = createLogger('AutoConfigurator');

/**
 * 自动配置器
 * 负责根据项目检测结果自动生成和应用最佳配置
 */
export class AutoConfigurator {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.projectDetector = new ProjectDetector();
    this.configTemplates = this.initializeTemplates();
  }

  /**
   * 初始化配置模板
   */
  initializeTemplates() {
    return {
      // Java项目模板
      java: {
        maven: {
          testCommand: 'mvn test',
          buildCommand: 'mvn compile',
          cleanCommand: 'mvn clean',
          packageCommand: 'mvn package -DskipTests',
          watchPattern: ['src/**/*.java'],
          testPattern: ['src/test/**/*Test.java'],
          sourcePattern: ['src/main/**/*.java'],
          ignorePattern: ['target/**', '*.class'],
          tddPhases: {
            red: {
              allowedPaths: ['src/test/**/*.java'],
              blockedPaths: ['src/main/**/*.java'],
              testCommand: 'mvn test-compile'
            },
            green: {
              allowedPaths: ['src/main/**/*.java'],
              blockedPaths: [],
              testCommand: 'mvn test'
            },
            refactor: {
              allowedPaths: ['src/main/**/*.java'],
              blockedPaths: ['src/test/**/*.java'],
              testCommand: 'mvn test'
            }
          }
        },
        gradle: {
          testCommand: 'gradle test',
          buildCommand: 'gradle build',
          cleanCommand: 'gradle clean',
          packageCommand: 'gradle build -x test',
          watchPattern: ['src/**/*.java'],
          testPattern: ['src/test/**/*Test.java'],
          sourcePattern: ['src/main/**/*.java'],
          ignorePattern: ['build/**', '*.class'],
          tddPhases: {
            red: {
              allowedPaths: ['src/test/**/*.java'],
              blockedPaths: ['src/main/**/*.java'],
              testCommand: 'gradle testClasses'
            },
            green: {
              allowedPaths: ['src/main/**/*.java'],
              blockedPaths: [],
              testCommand: 'gradle test'
            },
            refactor: {
              allowedPaths: ['src/main/**/*.java'],
              blockedPaths: ['src/test/**/*.java'],
              testCommand: 'gradle test'
            }
          }
        }
      },

      // JavaScript/TypeScript项目模板
      javascript: {
        npm: {
          testCommand: 'npm test',
          buildCommand: 'npm run build',
          cleanCommand: 'npm run clean',
          devCommand: 'npm run dev',
          watchPattern: ['src/**/*.{js,ts,jsx,tsx}'],
          testPattern: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
          sourcePattern: ['src/**/*.{js,ts,jsx,tsx}'],
          ignorePattern: ['node_modules/**', 'dist/**', 'build/**'],
          tddPhases: {
            red: {
              allowedPaths: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
              blockedPaths: ['src/**/!(*.test|*.spec).{js,ts,jsx,tsx}'],
              testCommand: 'npm run test:compile'
            },
            green: {
              allowedPaths: ['src/**/*.{js,ts,jsx,tsx}'],
              blockedPaths: [],
              testCommand: 'npm test'
            },
            refactor: {
              allowedPaths: ['src/**/!(*.test|*.spec).{js,ts,jsx,tsx}'],
              blockedPaths: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
              testCommand: 'npm test'
            }
          }
        },
        yarn: {
          testCommand: 'yarn test',
          buildCommand: 'yarn build',
          cleanCommand: 'yarn clean',
          devCommand: 'yarn dev',
          watchPattern: ['src/**/*.{js,ts,jsx,tsx}'],
          testPattern: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
          sourcePattern: ['src/**/*.{js,ts,jsx,tsx}'],
          ignorePattern: ['node_modules/**', 'dist/**', 'build/**'],
          tddPhases: {
            red: {
              allowedPaths: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
              blockedPaths: ['src/**/!(*.test|*.spec).{js,ts,jsx,tsx}'],
              testCommand: 'yarn test:compile'
            },
            green: {
              allowedPaths: ['src/**/*.{js,ts,jsx,tsx}'],
              blockedPaths: [],
              testCommand: 'yarn test'
            },
            refactor: {
              allowedPaths: ['src/**/!(*.test|*.spec).{js,ts,jsx,tsx}'],
              blockedPaths: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
              testCommand: 'yarn test'
            }
          }
        }
      },

      // Python项目模板
      python: {
        pytest: {
          testCommand: 'python -m pytest',
          buildCommand: 'python setup.py build',
          cleanCommand: 'find . -type d -name "__pycache__" -delete',
          watchPattern: ['**/*.py'],
          testPattern: ['**/test_*.py', '**/*_test.py'],
          sourcePattern: ['**/*.py'],
          ignorePattern: ['__pycache__/**', '*.pyc', 'build/**'],
          tddPhases: {
            red: {
              allowedPaths: ['**/test_*.py', '**/*_test.py'],
              blockedPaths: ['**/!(test_*|*_test).py'],
              testCommand: 'python -m py_compile'
            },
            green: {
              allowedPaths: ['**/*.py'],
              blockedPaths: [],
              testCommand: 'python -m pytest'
            },
            refactor: {
              allowedPaths: ['**/!(test_*|*_test).py'],
              blockedPaths: ['**/test_*.py', '**/*_test.py'],
              testCommand: 'python -m pytest'
            }
          }
        }
      },

      // Go项目模板
      go: {
        'go-test': {
          testCommand: 'go test ./...',
          buildCommand: 'go build',
          cleanCommand: 'go clean',
          watchPattern: ['**/*.go'],
          testPattern: ['**/*_test.go'],
          sourcePattern: ['**/*.go'],
          ignorePattern: ['vendor/**'],
          tddPhases: {
            red: {
              allowedPaths: ['**/*_test.go'],
              blockedPaths: ['**/!(*_test).go'],
              testCommand: 'go test -c'
            },
            green: {
              allowedPaths: ['**/*.go'],
              blockedPaths: [],
              testCommand: 'go test ./...'
            },
            refactor: {
              allowedPaths: ['**/!(*_test).go'],
              blockedPaths: ['**/*_test.go'],
              testCommand: 'go test ./...'
            }
          }
        }
      }
    };
  }

  /**
   * 自动配置项目
   */
  async autoConfigureProject(projectRoot) {
    logger.info(`⚙️ 开始自动配置项目: ${projectRoot}`);

    try {
      // 1. 检测项目信息
      const projectInfo = await this.projectDetector.detectProject(projectRoot);
      
      // 2. 生成配置
      const configuration = await this.generateConfiguration(projectInfo);
      
      // 3. 创建必要目录结构
      await this.createProjectStructure(projectRoot, configuration);
      
      // 4. 生成配置文件
      await this.generateConfigFiles(projectRoot, configuration);
      
      // 5. 设置项目会话状态
      await this.setupProjectSession(projectRoot, configuration);

      logger.info(`✅ 自动配置完成`);

      return {
        success: true,
        projectInfo,
        configuration,
        message: `项目已自动配置为 ${projectInfo.type} 项目，使用 ${configuration.buildTool} 构建工具`
      };

    } catch (error) {
      logger.error('自动配置失败:', error);
      return {
        success: false,
        error: {
          code: 'AUTO_CONFIGURE_FAILED',
          message: error.message,
          details: error.stack
        }
      };
    }
  }

  /**
   * 生成项目配置
   */
  async generateConfiguration(projectInfo) {
    logger.info(`🔧 生成配置: ${projectInfo.type} - ${projectInfo.buildTool}`);

    // 获取基础配置模板
    const template = this.getConfigTemplate(projectInfo);
    
    const configuration = {
      projectType: projectInfo.type,
      language: projectInfo.language,
      buildTool: projectInfo.buildTool,
      testFrameworks: projectInfo.testFramework.map(f => f.name),
      frameworks: projectInfo.framework.map(f => f.name),
      
      // 命令配置
      commands: {
        test: template.testCommand,
        build: template.buildCommand,
        clean: template.cleanCommand || 'echo "No clean command configured"',
        dev: template.devCommand || template.buildCommand
      },

      // 文件模式配置
      patterns: {
        watch: template.watchPattern,
        test: template.testPattern,
        source: template.sourcePattern,
        ignore: template.ignorePattern
      },

      // TDD阶段配置
      tddPhases: template.tddPhases || {},

      // 项目结构配置
      structure: {
        hasTests: projectInfo.structure.hasTests,
        testDirs: projectInfo.structure.testDir,
        sourceDirs: projectInfo.structure.sourceDir,
        suggestions: projectInfo.suggestions
      },

      // 自动化配置
      automation: {
        autoTest: true,
        autoWatch: true,
        smartPhaseTransition: true,
        contextualTips: true
      },

      // 初始化状态
      initialized: true,
      configuredAt: new Date().toISOString()
    };

    return configuration;
  }

  /**
   * 获取配置模板
   */
  getConfigTemplate(projectInfo) {
    const { type, buildTool } = projectInfo;
    
    // 首选：精确匹配类型和构建工具
    if (this.configTemplates[type] && this.configTemplates[type][buildTool]) {
      return this.configTemplates[type][buildTool];
    }
    
    // 备选：匹配类型的第一个模板
    if (this.configTemplates[type]) {
      const firstTemplate = Object.values(this.configTemplates[type])[0];
      if (firstTemplate) {
        return firstTemplate;
      }
    }
    
    // 默认：通用模板
    return {
      testCommand: 'echo "Please configure test command"',
      buildCommand: 'echo "Please configure build command"',
      watchPattern: ['**/*'],
      testPattern: ['**/test/**/*', '**/*test*'],
      sourcePattern: ['src/**/*'],
      ignorePattern: ['node_modules/**', 'target/**', 'build/**']
    };
  }

  /**
   * 创建项目结构
   */
  async createProjectStructure(projectRoot, configuration) {
    logger.info(`📁 创建项目结构`);

    const structureNeeds = configuration.structure.suggestions
      .filter(s => s.action === 'create_test_structure');

    if (structureNeeds.length === 0) {
      return; // 结构已经存在
    }

    // 根据项目类型创建标准结构
    const { projectType } = configuration;

    switch (projectType) {
      case 'java':
        await this.createJavaStructure(projectRoot);
        break;
      case 'javascript':
      case 'typescript':
        await this.createJSStructure(projectRoot);
        break;
      case 'python':
        await this.createPythonStructure(projectRoot);
        break;
      case 'go':
        await this.createGoStructure(projectRoot);
        break;
      default:
        await this.createGenericStructure(projectRoot);
    }
  }

  /**
   * 创建Java项目结构
   */
  async createJavaStructure(projectRoot) {
    const dirs = [
      'src/main/java',
      'src/main/resources',
      'src/test/java',
      'src/test/resources'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectRoot, dir));
    }

    // 创建示例测试类
    const testContent = `package com.example;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

/**
 * 示例测试类 - TDD工作流起点
 * 
 * TDD三步骤：
 * 1. RED - 编写失败的测试
 * 2. GREEN - 编写最少代码让测试通过
 * 3. REFACTOR - 重构代码提高质量
 */
class ExampleTest {
    
    @Test
    void shouldReturnTrue() {
        // 这是一个起始测试
        // 删除此方法并开始你的TDD之旅
        assertTrue(true);
    }
}`;

    await fs.writeFile(
      path.join(projectRoot, 'src/test/java/ExampleTest.java'),
      testContent
    );
  }

  /**
   * 创建JavaScript项目结构
   */
  async createJSStructure(projectRoot) {
    const dirs = ['src', 'test'];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectRoot, dir));
    }

    // 创建示例测试
    const testContent = `/**
 * 示例测试 - TDD工作流起点
 * 
 * TDD三步骤：
 * 1. RED - 编写失败的测试
 * 2. GREEN - 编写最少代码让测试通过  
 * 3. REFACTOR - 重构代码提高质量
 */

describe('Example', () => {
  it('should return true', () => {
    // 这是一个起始测试
    // 删除此测试并开始你的TDD之旅
    expect(true).toBe(true);
  });
});`;

    await fs.writeFile(
      path.join(projectRoot, 'test/example.test.js'),
      testContent
    );
  }

  /**
   * 创建Python项目结构
   */
  async createPythonStructure(projectRoot) {
    const dirs = ['src', 'tests'];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectRoot, dir));
    }

    // 创建__init__.py文件
    await fs.writeFile(path.join(projectRoot, 'src/__init__.py'), '');
    await fs.writeFile(path.join(projectRoot, 'tests/__init__.py'), '');

    // 创建示例测试
    const testContent = `"""
示例测试 - TDD工作流起点

TDD三步骤：
1. RED - 编写失败的测试
2. GREEN - 编写最少代码让测试通过
3. REFACTOR - 重构代码提高质量
"""

def test_example():
    """这是一个起始测试，删除此函数并开始你的TDD之旅"""
    assert True
`;

    await fs.writeFile(
      path.join(projectRoot, 'tests/test_example.py'),
      testContent
    );
  }

  /**
   * 创建Go项目结构
   */
  async createGoStructure(projectRoot) {
    const dirs = ['cmd', 'pkg', 'internal'];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectRoot, dir));
    }

    // 创建示例测试
    const testContent = `package main

import "testing"

/*
示例测试 - TDD工作流起点

TDD三步骤：
1. RED - 编写失败的测试
2. GREEN - 编写最少代码让测试通过
3. REFACTOR - 重构代码提高质量
*/

func TestExample(t *testing.T) {
	// 这是一个起始测试
	// 删除此函数并开始你的TDD之旅
	if !true {
		t.Error("Expected true")
	}
}`;

    await fs.writeFile(
      path.join(projectRoot, 'example_test.go'),
      testContent
    );
  }

  /**
   * 创建通用项目结构
   */
  async createGenericStructure(projectRoot) {
    const dirs = ['src', 'test'];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectRoot, dir));
    }

    // 创建README
    const readmeContent = `# TDD项目

这是一个TDD (测试驱动开发) 项目。

## TDD工作流

1. **RED** - 编写一个失败的测试
2. **GREEN** - 编写最少代码让测试通过
3. **REFACTOR** - 重构代码提高质量

## 快速开始

请根据你的项目类型配置相应的测试框架和构建工具。

## 目录结构

- \`src/\` - 源代码目录
- \`test/\` - 测试代码目录
`;

    await fs.writeFile(
      path.join(projectRoot, 'README.md'),
      readmeContent
    );
  }

  /**
   * 生成配置文件
   */
  async generateConfigFiles(projectRoot, configuration) {
    logger.info(`📝 生成配置文件`);

    // 生成TDD配置文件
    const tddConfigPath = path.join(projectRoot, '.tdd-config.json');
    await fs.writeFile(tddConfigPath, JSON.stringify(configuration, null, 2));

    // 生成.gitignore（如果不存在）
    const gitignorePath = path.join(projectRoot, '.gitignore');
    if (!await fs.pathExists(gitignorePath)) {
      const gitignoreContent = this.generateGitignoreContent(configuration);
      await fs.writeFile(gitignorePath, gitignoreContent);
    }

    // 为不同项目类型生成特定配置
    switch (configuration.projectType) {
      case 'javascript':
      case 'typescript':
        await this.generateJSConfigs(projectRoot, configuration);
        break;
      case 'java':
        await this.generateJavaConfigs(projectRoot, configuration);
        break;
      case 'python':
        await this.generatePythonConfigs(projectRoot, configuration);
        break;
    }
  }

  /**
   * 生成JS项目配置
   */
  async generateJSConfigs(projectRoot, configuration) {
    // 检查package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) {
      const packageJson = {
        name: path.basename(projectRoot),
        version: '1.0.0',
        description: 'TDD project',
        main: 'src/index.js',
        scripts: {
          test: 'jest',
          'test:watch': 'jest --watch',
          'test:coverage': 'jest --coverage'
        },
        devDependencies: {
          jest: '^29.0.0'
        }
      };

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  /**
   * 生成Java项目配置
   */
  async generateJavaConfigs(projectRoot, configuration) {
    // 如果没有pom.xml且没有build.gradle，创建基础pom.xml
    const pomPath = path.join(projectRoot, 'pom.xml');
    const gradlePath = path.join(projectRoot, 'build.gradle');
    
    if (!await fs.pathExists(pomPath) && !await fs.pathExists(gradlePath)) {
      const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>${path.basename(projectRoot)}</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <name>TDD Project</name>
    <description>Test-Driven Development project</description>
    
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>5.9.2</junit.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>\${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M9</version>
            </plugin>
        </plugins>
    </build>
</project>`;

      await fs.writeFile(pomPath, pomContent);
    }
  }

  /**
   * 生成Python项目配置
   */
  async generatePythonConfigs(projectRoot, configuration) {
    // 生成requirements.txt
    const reqPath = path.join(projectRoot, 'requirements.txt');
    if (!await fs.pathExists(reqPath)) {
      const requirements = `pytest>=7.0.0
pytest-cov>=4.0.0
pytest-watch>=4.2.0
`;
      await fs.writeFile(reqPath, requirements);
    }

    // 生成pytest配置
    const pytestConfigPath = path.join(projectRoot, 'pytest.ini');
    if (!await fs.pathExists(pytestConfigPath)) {
      const pytestConfig = `[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --cov=src --cov-report=html
`;
      await fs.writeFile(pytestConfigPath, pytestConfig);
    }
  }

  /**
   * 生成.gitignore内容
   */
  generateGitignoreContent(configuration) {
    const commonIgnores = [
      '# IDE',
      '.vscode/',
      '.idea/',
      '*.swp',
      '*.swo',
      '',
      '# OS',
      '.DS_Store',
      'Thumbs.db',
      ''
    ];

    const typeSpecificIgnores = {
      java: [
        '# Java',
        'target/',
        '*.class',
        '*.jar',
        '*.war',
        '*.ear',
        'hs_err_pid*',
        ''
      ],
      javascript: [
        '# Node.js',
        'node_modules/',
        'dist/',
        'build/',
        '*.log',
        '.env',
        'coverage/',
        ''
      ],
      python: [
        '# Python',
        '__pycache__/',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '.pytest_cache/',
        'htmlcov/',
        '.coverage',
        ''
      ],
      go: [
        '# Go',
        'vendor/',
        '*.exe',
        '*.test',
        '*.prof',
        ''
      ]
    };

    const ignores = [...commonIgnores];
    
    if (typeSpecificIgnores[configuration.projectType]) {
      ignores.push(...typeSpecificIgnores[configuration.projectType]);
    }

    ignores.push('# TDD Config', '.tdd-config.json');

    return ignores.join('\n');
  }

  /**
   * 设置项目会话状态
   */
  async setupProjectSession(projectRoot, configuration) {
    logger.info(`⚡ 设置项目会话状态`);

    // 为项目设置初始TDD状态
    const initialState = {
      feature: null,
      phase: null,
      phaseStartedAt: null,
      configuration,
      autoConfigured: true,
      lastActivity: new Date().toISOString()
    };

    // 保存到会话管理器
    await this.sessionManager.setState(projectRoot, initialState);
    
    logger.info(`✅ 项目会话状态已设置`);
  }

  /**
   * 验证配置有效性
   */
  async validateConfiguration(projectRoot, configuration) {
    const issues = [];

    // 验证测试命令
    if (configuration.commands.test.includes('echo')) {
      issues.push({
        severity: 'error',
        message: '测试命令未正确配置',
        suggestion: '请手动配置合适的测试运行命令'
      });
    }

    // 验证目录结构
    if (!configuration.structure.hasTests) {
      issues.push({
        severity: 'warning',
        message: '项目缺少测试目录',
        suggestion: '建议创建测试目录以支持TDD工作流'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}