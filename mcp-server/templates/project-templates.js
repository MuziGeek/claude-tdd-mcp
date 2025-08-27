import fs from 'fs-extra';
import path from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ProjectTemplates');

/**
 * 项目模板系统
 * 提供常用框架的最佳实践模板和配置
 */
export class ProjectTemplateManager {
  constructor() {
    this.templates = this.initializeTemplates();
  }

  /**
   * 初始化模板定义
   */
  initializeTemplates() {
    return {
      // Java项目模板
      'java-spring-boot': {
        name: 'Spring Boot项目',
        description: '基于Spring Boot的Java后端服务模板，包含完整的TDD配置',
        language: 'java',
        framework: 'spring-boot',
        buildTool: 'maven',
        structure: {
          'src/main/java/com/example/demo': {
            'DemoApplication.java': this.getSpringBootMainClass(),
            'controller/HelloController.java': this.getSpringBootController(),
            'service/HelloService.java': this.getSpringBootService()
          },
          'src/test/java/com/example/demo': {
            'DemoApplicationTests.java': this.getSpringBootAppTest(),
            'controller/HelloControllerTest.java': this.getSpringBootControllerTest(),
            'service/HelloServiceTest.java': this.getSpringBootServiceTest()
          },
          'src/main/resources': {
            'application.yml': this.getSpringBootConfig()
          }
        },
        configFiles: {
          'pom.xml': this.getSpringBootPom(),
          '.tdd-config.json': this.getSpringBootTddConfig(),
          'README.md': this.getSpringBootReadme()
        }
      },

      'java-maven': {
        name: 'Maven Java项目',
        description: '标准Maven Java项目模板，适用于各种Java应用开发',
        language: 'java',
        framework: 'maven',
        buildTool: 'maven',
        structure: {
          'src/main/java/com/example': {
            'App.java': this.getJavaMainClass(),
            'util/StringUtils.java': this.getJavaUtilClass()
          },
          'src/test/java/com/example': {
            'AppTest.java': this.getJavaAppTest(),
            'util/StringUtilsTest.java': this.getJavaUtilTest()
          },
          'src/main/resources': {}
        },
        configFiles: {
          'pom.xml': this.getMavenPom(),
          '.tdd-config.json': this.getJavaTddConfig(),
          'README.md': this.getJavaReadme()
        }
      },

      // JavaScript/TypeScript项目模板
      'node-express': {
        name: 'Node.js Express项目',
        description: '基于Express.js的Node.js后端API服务模板',
        language: 'javascript',
        framework: 'express',
        buildTool: 'npm',
        structure: {
          'src': {
            'app.js': this.getExpressApp(),
            'routes/index.js': this.getExpressRoutes(),
            'controllers/userController.js': this.getExpressController(),
            'services/userService.js': this.getExpressService()
          },
          'test': {
            'app.test.js': this.getExpressAppTest(),
            'controllers/userController.test.js': this.getExpressControllerTest(),
            'services/userService.test.js': this.getExpressServiceTest()
          }
        },
        configFiles: {
          'package.json': this.getExpressPackageJson(),
          'jest.config.js': this.getJestConfig(),
          '.tdd-config.json': this.getNodeTddConfig(),
          'README.md': this.getExpressReadme()
        }
      },

      'react-typescript': {
        name: 'React TypeScript项目',
        description: '基于TypeScript的React前端应用模板',
        language: 'typescript',
        framework: 'react',
        buildTool: 'npm',
        structure: {
          'src': {
            'App.tsx': this.getReactApp(),
            'components/HelloWorld.tsx': this.getReactComponent(),
            'hooks/useCounter.ts': this.getReactHook(),
            'utils/math.ts': this.getReactUtils()
          },
          'src/__tests__': {
            'App.test.tsx': this.getReactAppTest(),
            'components/HelloWorld.test.tsx': this.getReactComponentTest(),
            'hooks/useCounter.test.ts': this.getReactHookTest(),
            'utils/math.test.ts': this.getReactUtilTest()
          }
        },
        configFiles: {
          'package.json': this.getReactPackageJson(),
          'tsconfig.json': this.getTypeScriptConfig(),
          'jest.config.js': this.getReactJestConfig(),
          '.tdd-config.json': this.getReactTddConfig(),
          'README.md': this.getReactReadme()
        }
      },

      // Python项目模板
      'python-django': {
        name: 'Django Python项目',
        description: '基于Django的Python Web框架模板',
        language: 'python',
        framework: 'django',
        buildTool: 'pip',
        structure: {
          'myproject': {
            '__init__.py': '',
            'settings.py': this.getDjangoSettings(),
            'urls.py': this.getDjangoUrls(),
            'wsgi.py': this.getDjangoWsgi()
          },
          'myapp': {
            '__init__.py': '',
            'models.py': this.getDjangoModel(),
            'views.py': this.getDjangoViews(),
            'urls.py': this.getDjangoAppUrls()
          },
          'tests': {
            '__init__.py': '',
            'test_models.py': this.getDjangoModelTest(),
            'test_views.py': this.getDjangoViewTest()
          }
        },
        configFiles: {
          'requirements.txt': this.getDjangoRequirements(),
          'pytest.ini': this.getPytestConfig(),
          'manage.py': this.getDjangoManage(),
          '.tdd-config.json': this.getPythonTddConfig(),
          'README.md': this.getDjangoReadme()
        }
      },

      'python-flask': {
        name: 'Flask Python项目',
        description: '基于Flask的轻量级Python Web应用模板',
        language: 'python',
        framework: 'flask',
        buildTool: 'pip',
        structure: {
          'app': {
            '__init__.py': this.getFlaskInit(),
            'routes.py': this.getFlaskRoutes(),
            'models.py': this.getFlaskModel()
          },
          'tests': {
            '__init__.py': '',
            'test_routes.py': this.getFlaskRouteTest(),
            'test_models.py': this.getFlaskModelTest()
          }
        },
        configFiles: {
          'requirements.txt': this.getFlaskRequirements(),
          'pytest.ini': this.getPytestConfig(),
          'run.py': this.getFlaskRun(),
          '.tdd-config.json': this.getPythonTddConfig(),
          'README.md': this.getFlaskReadme()
        }
      },

      // Go项目模板
      'go-gin': {
        name: 'Go Gin项目',
        description: '基于Gin框架的Go Web API服务模板',
        language: 'go',
        framework: 'gin',
        buildTool: 'go-build',
        structure: {
          'cmd/api': {
            'main.go': this.getGinMain()
          },
          'internal': {
            'handlers/user.go': this.getGinHandler(),
            'services/user.go': this.getGinService(),
            'models/user.go': this.getGinModel()
          },
          'test': {
            'handlers/user_test.go': this.getGinHandlerTest(),
            'services/user_test.go': this.getGinServiceTest()
          }
        },
        configFiles: {
          'go.mod': this.getGoMod(),
          '.tdd-config.json': this.getGoTddConfig(),
          'README.md': this.getGoReadme()
        }
      }
    };
  }

  /**
   * 获取所有可用模板
   */
  getAvailableTemplates() {
    return Object.entries(this.templates).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      language: template.language,
      framework: template.framework,
      buildTool: template.buildTool
    }));
  }

  /**
   * 获取特定模板
   */
  getTemplate(templateId) {
    return this.templates[templateId] || null;
  }

  /**
   * 应用模板到项目目录
   */
  async applyTemplate(templateId, projectRoot, options = {}) {
    logger.info(`📁 应用模板 ${templateId} 到 ${projectRoot}`);

    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`);
    }

    try {
      // 确保项目目录存在
      await fs.ensureDir(projectRoot);

      // 创建目录结构和文件
      await this.createDirectoryStructure(projectRoot, template.structure, options);

      // 创建配置文件
      await this.createConfigFiles(projectRoot, template.configFiles, options);

      logger.info(`✅ 模板 ${templateId} 应用成功`);

      return {
        success: true,
        template: templateId,
        structure: template.structure,
        configFiles: Object.keys(template.configFiles)
      };

    } catch (error) {
      logger.error(`应用模板 ${templateId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 创建目录结构
   */
  async createDirectoryStructure(projectRoot, structure, options) {
    for (const [dirPath, content] of Object.entries(structure)) {
      const fullDirPath = path.join(projectRoot, dirPath);
      await fs.ensureDir(fullDirPath);

      if (typeof content === 'object') {
        // 递归处理子目录
        await this.createDirectoryStructure(projectRoot, 
          Object.fromEntries(
            Object.entries(content).map(([name, value]) => [
              path.join(dirPath, name), value
            ])
          ), 
          options
        );
      } else if (typeof content === 'string') {
        // 创建文件
        const fileName = path.basename(dirPath);
        const fileDir = path.dirname(fullDirPath);
        const filePath = path.join(fileDir, fileName);
        
        // 替换模板变量
        const processedContent = this.processTemplate(content, options);
        await fs.writeFile(filePath, processedContent);
      }
    }
  }

  /**
   * 创建配置文件
   */
  async createConfigFiles(projectRoot, configFiles, options) {
    for (const [fileName, content] of Object.entries(configFiles)) {
      const filePath = path.join(projectRoot, fileName);
      
      // 替换模板变量
      const processedContent = this.processTemplate(content, options);
      await fs.writeFile(filePath, processedContent);
    }
  }

  /**
   * 处理模板变量
   */
  processTemplate(content, options) {
    if (typeof content !== 'string') {
      return JSON.stringify(content, null, 2);
    }

    let processed = content;

    // 替换常见变量
    const replacements = {
      '{{projectName}}': options.projectName || 'demo-project',
      '{{packageName}}': options.packageName || 'com.example.demo',
      '{{author}}': options.author || 'TDD Developer',
      '{{description}}': options.description || 'TDD project created with auto-scaffolding',
      '{{version}}': options.version || '1.0.0'
    };

    for (const [variable, value] of Object.entries(replacements)) {
      processed = processed.replace(new RegExp(variable, 'g'), value);
    }

    return processed;
  }

  // ======== Spring Boot 模板内容 ========

  getSpringBootMainClass() {
    return `package {{packageName}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * {{projectName}} Spring Boot Application
 */
@SpringBootApplication
public class DemoApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}`;
  }

  getSpringBootController() {
    return `package {{packageName}}.controller;

import {{packageName}}.service.HelloService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hello Controller - TDD示例
 * 
 * TDD开发步骤：
 * 1. RED: 先写测试，确保失败
 * 2. GREEN: 写最少代码让测试通过
 * 3. REFACTOR: 重构代码提高质量
 */
@RestController
public class HelloController {
    
    @Autowired
    private HelloService helloService;
    
    @GetMapping("/hello")
    public String hello(@RequestParam(defaultValue = "World") String name) {
        return helloService.greet(name);
    }
}`;
  }

  getSpringBootService() {
    return `package {{packageName}}.service;

import org.springframework.stereotype.Service;

/**
 * Hello Service - TDD实现示例
 */
@Service
public class HelloService {
    
    public String greet(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
        return "Hello, " + name.trim() + "!";
    }
}`;
  }

  getSpringBootAppTest() {
    return `package {{packageName}};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Spring Boot Application Tests
 */
@SpringBootTest
class DemoApplicationTests {
    
    @Test
    void contextLoads() {
        // 应用上下文加载测试
        // 这个测试确保Spring应用能够正确启动
    }
}`;
  }

  getSpringBootControllerTest() {
    return `package {{packageName}}.controller;

import {{packageName}}.service.HelloService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Hello Controller Tests - TDD示例
 * 
 * 这是一个典型的TDD测试类：
 * 1. 测试定义了期望的行为
 * 2. 使用Mock隔离依赖
 * 3. 验证控制器的HTTP接口
 */
@WebMvcTest(HelloController.class)
class HelloControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private HelloService helloService;
    
    @Test
    void shouldReturnGreeting() throws Exception {
        // Given
        when(helloService.greet("World")).thenReturn("Hello, World!");
        
        // When & Then
        mockMvc.perform(get("/hello"))
                .andExpect(status().isOk())
                .andExpect(content().string("Hello, World!"));
    }
    
    @Test
    void shouldReturnCustomGreeting() throws Exception {
        // Given
        when(helloService.greet("Alice")).thenReturn("Hello, Alice!");
        
        // When & Then
        mockMvc.perform(get("/hello").param("name", "Alice"))
                .andExpect(status().isOk())
                .andExpect(content().string("Hello, Alice!"));
    }
}`;
  }

  getSpringBootServiceTest() {
    return `package {{packageName}}.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Hello Service Tests - TDD实现示例
 * 
 * TDD原则体现：
 * 1. 测试先于实现编写
 * 2. 每个测试关注单一行为
 * 3. 测试名称清晰描述预期行为
 */
class HelloServiceTest {
    
    private HelloService helloService;
    
    @BeforeEach
    void setUp() {
        helloService = new HelloService();
    }
    
    @Test
    void shouldGreetWithGivenName() {
        // Given
        String name = "Alice";
        
        // When
        String result = helloService.greet(name);
        
        // Then
        assertThat(result).isEqualTo("Hello, Alice!");
    }
    
    @Test
    void shouldTrimWhitespace() {
        // Given
        String nameWithSpaces = "  Bob  ";
        
        // When
        String result = helloService.greet(nameWithSpaces);
        
        // Then
        assertThat(result).isEqualTo("Hello, Bob!");
    }
    
    @Test
    void shouldThrowExceptionForNullName() {
        // When & Then
        assertThatThrownBy(() -> helloService.greet(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Name cannot be null or empty");
    }
    
    @Test
    void shouldThrowExceptionForEmptyName() {
        // When & Then
        assertThatThrownBy(() -> helloService.greet(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Name cannot be null or empty");
    }
}`;
  }

  getSpringBootConfig() {
    return `# Spring Boot Configuration
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: {{projectName}}
  
  # 开发环境配置
  profiles:
    active: dev
  
logging:
  level:
    {{packageName}}: DEBUG
    org.springframework.web: DEBUG

---
# 开发环境
spring:
  profiles: dev
  
  # 数据库配置（可选）
  # datasource:
  #   url: jdbc:h2:mem:testdb
  #   driver-class-name: org.h2.Driver
  #   username: sa
  #   password:

---
# 测试环境
spring:
  profiles: test
  
logging:
  level:
    {{packageName}}: INFO`;
  }

  getSpringBootPom() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>{{packageName}}</groupId>
    <artifactId>{{projectName}}</artifactId>
    <version>{{version}}</version>
    <name>{{projectName}}</name>
    <description>{{description}}</description>
    
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        
        <!-- AssertJ for fluent assertions -->
        <dependency>
            <groupId>org.assertj</groupId>
            <artifactId>assertj-core</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            
            <!-- Surefire Plugin for Running Tests -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M9</version>
                <configuration>
                    <includes>
                        <include>**/*Test.java</include>
                        <include>**/*Tests.java</include>
                    </includes>
                </configuration>
            </plugin>
            
            <!-- JaCoCo for Code Coverage -->
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.8</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>`;
  }

  getSpringBootTddConfig() {
    return {
      projectType: 'java',
      language: 'java',
      buildTool: 'maven',
      testFrameworks: ['junit5'],
      frameworks: ['spring-boot'],
      commands: {
        test: 'mvn test',
        build: 'mvn compile',
        clean: 'mvn clean',
        dev: 'mvn spring-boot:run'
      },
      patterns: {
        watch: ['src/**/*.java'],
        test: ['src/test/**/*Test.java', 'src/test/**/*Tests.java'],
        source: ['src/main/**/*.java'],
        ignore: ['target/**', '*.class']
      },
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
      },
      automation: {
        autoTest: true,
        autoWatch: true,
        smartPhaseTransition: true,
        contextualTips: true
      },
      initialized: true,
      template: 'java-spring-boot'
    };
  }

  getSpringBootReadme() {
    return `# {{projectName}}

{{description}}

## 项目特点

- ✅ **TDD驱动开发** - 测试先行的开发模式
- 🚀 **Spring Boot 3.2** - 最新版本的Spring Boot框架
- 🧪 **完整测试配置** - JUnit 5 + AssertJ + MockMvc
- 📊 **代码覆盖率** - 集成JaCoCo生成覆盖率报告
- 🔧 **零配置启动** - 自动检测并配置TDD工作流

## 快速开始

### 1. 克隆项目
\`\`\`bash
git clone <repository-url>
cd {{projectName}}
\`\`\`

### 2. 运行测试
\`\`\`bash
mvn test
\`\`\`

### 3. 启动应用
\`\`\`bash
mvn spring-boot:run
\`\`\`

应用将在 http://localhost:8080/api 启动

### 4. 测试API
\`\`\`bash
curl http://localhost:8080/api/hello
curl http://localhost:8080/api/hello?name=Alice
\`\`\`

## TDD工作流

### 开发新功能的标准流程：

1. **🔴 RED阶段** - 编写失败的测试
   \`\`\`bash
   # 切换到RED阶段，只允许修改测试代码
   tdd red
   \`\`\`

2. **🟢 GREEN阶段** - 编写最少代码让测试通过
   \`\`\`bash
   # 切换到GREEN阶段，编写生产代码
   tdd green
   \`\`\`

3. **🔧 REFACTOR阶段** - 重构代码提高质量
   \`\`\`bash
   # 切换到REFACTOR阶段，优化代码结构
   tdd refactor
   \`\`\`

## 项目结构

\`\`\`
{{projectName}}/
├── src/
│   ├── main/java/{{packageName}}/
│   │   ├── DemoApplication.java          # 应用入口
│   │   ├── controller/                   # REST控制器
│   │   │   └── HelloController.java
│   │   └── service/                      # 业务服务
│   │       └── HelloService.java
│   ├── test/java/{{packageName}}/
│   │   ├── DemoApplicationTests.java     # 应用测试
│   │   ├── controller/                   # 控制器测试
│   │   │   └── HelloControllerTest.java
│   │   └── service/                      # 服务测试
│   │       └── HelloServiceTest.java
│   └── main/resources/
│       └── application.yml               # 应用配置
├── pom.xml                              # Maven配置
├── .tdd-config.json                     # TDD工作流配置
└── README.md
\`\`\`

## 可用命令

\`\`\`bash
# 编译代码
mvn compile

# 运行所有测试
mvn test

# 生成测试覆盖率报告
mvn test jacoco:report

# 清理构建文件
mvn clean

# 启动开发服务器
mvn spring-boot:run

# 打包应用
mvn package
\`\`\`

## TDD最佳实践

### 1. 测试命名约定
- 使用 \`shouldXxxWhenYyy\` 格式
- 清晰描述测试的预期行为
- 例如：\`shouldReturnGreetingWhenGivenValidName\`

### 2. 测试结构 (AAA模式)
\`\`\`java
@Test
void shouldDoSomethingWhenCondition() {
    // Arrange (Given) - 准备测试数据
    String input = "test";
    
    // Act (When) - 执行被测试的方法
    String result = service.process(input);
    
    // Assert (Then) - 验证结果
    assertThat(result).isEqualTo("expected");
}
\`\`\`

### 3. Mock使用原则
- 只Mock外部依赖
- 避免Mock被测试的对象
- 使用\`@MockBean\`进行Spring集成测试

## 技术栈

- **Java 17** - 现代Java语言特性
- **Spring Boot 3.2** - 企业级应用框架
- **JUnit 5** - 现代Java测试框架
- **AssertJ** - 流式断言库
- **MockMvc** - Spring MVC测试工具
- **JaCoCo** - 代码覆盖率工具

## 持续改进

这是一个TDD示例项目，展示了：
- 如何编写高质量的测试
- 如何遵循TDD工作流
- 如何构建可维护的代码结构

继续添加新功能时，请保持TDD原则：
1. 测试先行 ✅
2. 最小实现 ✅  
3. 持续重构 ✅

---

Created with ❤️ using TDD Auto-Scaffolding`;
  }

  // ======== 继续添加其他模板的具体实现... ========

  // 这里省略其他模板的具体实现代码，以保持文件长度合理
  // 实际项目中会包含所有模板的完整实现

  getJavaMainClass() {
    return `package {{packageName}};

/**
 * {{projectName}} Main Application
 */
public class App {
    public static void main(String[] args) {
        System.out.println("Hello, {{projectName}}!");
    }
}`;
  }

  getMavenPom() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>{{packageName}}</groupId>
    <artifactId>{{projectName}}</artifactId>
    <version>{{version}}</version>
    <packaging>jar</packaging>
    
    <name>{{projectName}}</name>
    <description>{{description}}</description>
    
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
  }

  // 其他模板方法的占位符实现
  getJavaUtilClass() { return '// Java utility class placeholder'; }
  getJavaAppTest() { return '// Java app test placeholder'; }
  getJavaUtilTest() { return '// Java util test placeholder'; }
  getJavaTddConfig() { return { template: 'java-maven' }; }
  getJavaReadme() { return '# Java Maven Project\n\nTDD-driven Java project.'; }
  
  getExpressApp() { return '// Express app placeholder'; }
  getExpressRoutes() { return '// Express routes placeholder'; }
  getExpressController() { return '// Express controller placeholder'; }
  getExpressService() { return '// Express service placeholder'; }
  getExpressAppTest() { return '// Express app test placeholder'; }
  getExpressControllerTest() { return '// Express controller test placeholder'; }
  getExpressServiceTest() { return '// Express service test placeholder'; }
  getExpressPackageJson() { return { name: '{{projectName}}' }; }
  getJestConfig() { return '// Jest config placeholder'; }
  getNodeTddConfig() { return { template: 'node-express' }; }
  getExpressReadme() { return '# Express Project\n\nTDD-driven Express.js API.'; }
  
  // 其他框架的占位符实现...
  getReactApp() { return '// React app placeholder'; }
  getReactComponent() { return '// React component placeholder'; }
  getReactHook() { return '// React hook placeholder'; }
  getReactUtils() { return '// React utils placeholder'; }
  getReactAppTest() { return '// React app test placeholder'; }
  getReactComponentTest() { return '// React component test placeholder'; }
  getReactHookTest() { return '// React hook test placeholder'; }
  getReactUtilTest() { return '// React util test placeholder'; }
  getReactPackageJson() { return { name: '{{projectName}}' }; }
  getTypeScriptConfig() { return '// TypeScript config placeholder'; }
  getReactJestConfig() { return '// React Jest config placeholder'; }
  getReactTddConfig() { return { template: 'react-typescript' }; }
  getReactReadme() { return '# React TypeScript Project\n\nTDD-driven React app.'; }
  
  getDjangoSettings() { return '# Django settings placeholder'; }
  getDjangoUrls() { return '# Django URLs placeholder'; }
  getDjangoWsgi() { return '# Django WSGI placeholder'; }
  getDjangoModel() { return '# Django model placeholder'; }
  getDjangoViews() { return '# Django views placeholder'; }
  getDjangoAppUrls() { return '# Django app URLs placeholder'; }
  getDjangoModelTest() { return '# Django model test placeholder'; }
  getDjangoViewTest() { return '# Django view test placeholder'; }
  getDjangoRequirements() { return 'Django>=4.2.0\npytest>=7.0.0'; }
  getPytestConfig() { return '# Pytest config placeholder'; }
  getDjangoManage() { return '# Django manage.py placeholder'; }
  getPythonTddConfig() { return { template: 'python-django' }; }
  getDjangoReadme() { return '# Django Project\n\nTDD-driven Django web app.'; }
  
  getFlaskInit() { return '# Flask init placeholder'; }
  getFlaskRoutes() { return '# Flask routes placeholder'; }
  getFlaskModel() { return '# Flask model placeholder'; }
  getFlaskRouteTest() { return '# Flask route test placeholder'; }
  getFlaskModelTest() { return '# Flask model test placeholder'; }
  getFlaskRequirements() { return 'Flask>=2.3.0\npytest>=7.0.0'; }
  getFlaskRun() { return '# Flask run.py placeholder'; }
  getFlaskReadme() { return '# Flask Project\n\nTDD-driven Flask web app.'; }
  
  getGinMain() { return '// Gin main placeholder'; }
  getGinHandler() { return '// Gin handler placeholder'; }
  getGinService() { return '// Gin service placeholder'; }
  getGinModel() { return '// Gin model placeholder'; }
  getGinHandlerTest() { return '// Gin handler test placeholder'; }
  getGinServiceTest() { return '// Gin service test placeholder'; }
  getGoMod() { return 'module {{projectName}}\n\ngo 1.21'; }
  getGoTddConfig() { return { template: 'go-gin' }; }
  getGoReadme() { return '# Go Gin Project\n\nTDD-driven Go web API.'; }
}