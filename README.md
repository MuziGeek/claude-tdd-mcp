# Claude TDD Scaffold v2.0

专为Claude Code环境设计的TDD（测试驱动开发）脚手架工具，现在完全支持MCP（Model Context Protocol）服务集成。

## 🆕 v2.0新特性

- ✅ **MCP服务支持** - 提供完整的MCP服务，可直接在Claude Code中使用
- ✅ **双模式运行** - 支持CLI命令行和MCP工具两种使用方式
- ✅ **会话管理** - 跨Claude对话保持项目状态和配置
- ✅ **TDD相位管理** - 自动强制执行RED/GREEN/REFACTOR循环
- ✅ **深度项目分析** - AI驱动的项目架构和测试策略分析
- ✅ **自动化安装** - 一键配置Claude Desktop MCP集成

## 特性概览

- ✅ **Claude Code专用** - 针对Claude Code环境深度优化
- ✅ **Task Master集成** - 与Task Master AI MCP深度集成
- ✅ **多项目支持** - 支持Java Spring、Node.js、Python等项目类型
- ✅ **完整TDD流程** - PRD → 分析 → 设计 → 测试 → 实现
- ✅ **智能检测** - 自动检测项目类型和结构
- ✅ **配置迁移** - 支持TDD配置在项目间迁移
- ✅ **MCP工具集** - 17个专业MCP工具覆盖完整TDD生命周期

## 环境要求

⚠️ **重要：此工具专为Claude Code环境设计**

必要组件：
- Claude Code (claude.ai/code)  
- Claude Desktop (用于MCP服务)
- Node.js >= 16.0.0
- Task Master AI MCP服务（可选但推荐）

## 安装方式

### 方式1：MCP服务安装（推荐）

```bash
# 1. 克隆或下载项目
git clone <repository-url> tdd-scaffold
cd tdd-scaffold

# 2. 安装依赖
npm install

# 3. 运行自动安装脚本
node scripts/install-mcp.js
```

安装脚本会自动：
- 配置Claude Desktop的MCP服务
- 创建必要的缓存目录  
- 生成启动脚本
- 备份现有配置

### 方式2：手动MCP配置

编辑Claude Desktop配置文件：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tdd-scaffold": {
      "command": "node",
      "args": ["/path/to/tdd-scaffold/mcp-server/index.js"],
      "env": {
        "TDD_CACHE_DIR": "/path/to/cache",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 方式3：传统CLI安装

```bash
# 全局安装（用于CLI命令）
npm install -g .

# 项目级安装
npm install --save-dev .
```

## 使用方法

### MCP工具（推荐使用方式）

安装MCP服务后，在Claude Code中直接使用以下工具：

#### 项目管理工具
```javascript
// 初始化TDD项目
tdd_initialize({
  projectRoot: "/path/to/project",
  profile: "java-spring",
  force: false
})

// 扫描项目结构
tdd_scan_project({
  projectRoot: "/path/to/project",
  deep: true
})

// 深度分析项目
tdd_deep_analyze({
  projectRoot: "/path/to/project"
})

// 验证环境配置
tdd_validate_env({
  projectRoot: "/path/to/project"
})
```

#### TDD工作流工具
```javascript
// 切换TDD阶段
tdd_switch_phase({
  projectRoot: "/path/to/project",
  phase: "RED",
  featureId: "user-auth"
})

// 创建新特性
tdd_create_feature({
  projectRoot: "/path/to/project", 
  featureId: "user-profile",
  description: "用户资料管理功能"
})

// 获取TDD状态
tdd_get_status({
  projectRoot: "/path/to/project"
})

// 完成当前阶段
tdd_complete_phase({
  projectRoot: "/path/to/project",
  result: "所有测试通过"
})

// 验证文件路径
tdd_validate_path({
  projectRoot: "/path/to/project",
  filePath: "src/main/java/User.java"
})
```

#### 配置管理工具
```javascript
// 导出项目配置
tdd_export_config({
  projectRoot: "/path/to/project",
  outputPath: "my-config.json"
})

// 导入项目配置
tdd_import_config({
  projectRoot: "/path/to/project",
  configPath: "my-config.json",
  force: false
})

// 管理配置模板
tdd_manage_profiles({
  action: "list" | "export" | "import" | "delete",
  profileName: "my-profile",
  filePath: "profile.json"
})
```

#### 分析管理工具
```javascript
// 导出分析结果
tdd_export_analysis({
  projectRoot: "/path/to/project",
  outputPath: "analysis.json"
})

// 导入分析结果
tdd_import_analysis({
  projectRoot: "/path/to/project",
  analysisPath: "analysis.json"
})

// 比较分析结果
tdd_compare_analysis({
  projectRoot: "/path/to/project"
})

// 应用分析结果
tdd_apply_analysis({
  projectRoot: "/path/to/project",
  skipTestStrategy: false
})
```

### CLI命令（兼容模式）

```bash
# 初始化TDD脚手架
claude-tdd init /path/to/project

# 扫描项目
claude-tdd scan /path/to/project --deep

# 导出配置
claude-tdd export --output=my-tdd-config.json

# 导入配置  
claude-tdd import --config=my-tdd-config.json

# 环境检查
claude-tdd validate /path/to/project
```

## 支持的项目类型

- ✅ Java Spring Boot (Maven/Gradle)
- ✅ Node.js (Express/Fastify)
- ✅ Python (Django/FastAPI)  
- ✅ JavaScript/TypeScript (React/Vue)
- 🚧 .NET Core (计划中)
- 🚧 Go (计划中)
- 🚧 Rust (计划中)

## TDD工作流和相位管理

### TDD三相位循环

**RED相位** - 编写失败测试
- 只能修改测试文件(`tests/`目录)
- 禁止编辑生产代码
- 确保新测试失败

**GREEN相位** - 最小实现  
- 只能修改生产代码(`src/main/`等目录)
- 禁止修改测试代码
- 使测试通过的最小实现

**REFACTOR相位** - 重构优化
- 可以修改生产代码
- 禁止修改测试逻辑
- 保持所有测试通过

### 自动化质量门禁

MCP服务提供自动化质量检查：
- **路径验证**: 根据当前相位限制可编辑文件
- **测试运行**: 代码变更后自动运行测试套件
- **状态跟踪**: 记录TDD进度和相位转换历史
- **规则强制**: 阻止违反TDD原则的操作

## 斜杠命令集成

安装后可在Claude Code中使用：

```bash
# 特性管理 
/feature:init <feature_id>           # 初始化新特性
/feature:pm <feature_id>             # PRD编写阶段
/feature:analyze <feature_id>        # 需求分析阶段  
/feature:cases <feature_id>          # 测试用例阶段

# TDD循环
/tdd:red                             # 切换到RED相位
/tdd:green                           # 切换到GREEN相位
/tdd:refactor                        # 切换到REFACTOR相位
/tdd:implement                       # 完整TDD循环

# Task Master集成
/tm:next                             # 获取下一个任务
/tm:list                             # 列出所有任务
/tm:done <task_id>                   # 完成指定任务
```

## 目录结构

### MCP服务架构
```
tdd-scaffold/
├── mcp-server/                      # MCP服务器
│   ├── index.js                     # MCP服务入口
│   ├── tools/                       # MCP工具实现
│   │   ├── index.js                 # 工具注册器
│   │   ├── initialization.js        # 项目初始化工具
│   │   ├── scanning.js              # 项目扫描工具
│   │   ├── validation.js            # 环境验证工具
│   │   ├── configuration.js         # 配置管理工具
│   │   ├── analysis.js              # 分析管理工具
│   │   ├── profiles.js              # 模板管理工具
│   │   └── tdd-workflow.js          # TDD工作流工具
│   ├── resources/                   # MCP资源系统
│   │   ├── index.js                 # 资源注册器
│   │   ├── profiles.js              # 项目配置模板
│   │   ├── templates.js             # 代码生成模板
│   │   └── analysis-cache.js        # 分析结果缓存
│   ├── state/                       # 状态管理
│   │   └── session-manager.js       # 会话状态管理器
│   ├── tdd/                         # TDD相位管理
│   │   └── phase-manager.js         # TDD相位管理器
│   └── utils/                       # 工具函数
│       ├── logger.js                # 日志工具
│       └── cache.js                 # 缓存管理
├── scripts/                         # 部署脚本
│   ├── install-mcp.js               # MCP自动安装脚本
│   ├── start-mcp.sh                 # Linux/macOS启动脚本
│   └── start-mcp.bat                # Windows启动脚本
└── tests/                           # 测试套件
    ├── mcp-server/                  # MCP服务测试
    ├── unit/                        # 单元测试
    └── integration/                 # 集成测试
```

### 项目初始化后的结构
```
project/
├── .claude/                         # Claude Code配置
│   ├── agents/                      # 专业代理定义
│   │   ├── product-manager.md       # 产品经理代理
│   │   ├── prd-analyzer-designer.md # 需求分析设计代理
│   │   ├── test-case-generator.md   # 测试用例生成代理
│   │   └── tdd-architect.md         # TDD架构师代理
│   ├── commands/                    # 斜杠命令定义
│   │   ├── feature/                 # 特性管理命令
│   │   └── tdd/                     # TDD工作流命令
│   ├── hooks/                       # 质量门禁hooks
│   │   ├── tdd_guard.js             # TDD规则守护
│   │   └── run-tests.sh             # 自动测试运行
│   ├── schemas/                     # JSON Schema验证
│   │   ├── requirements.schema.json  # 需求文档schema
│   │   ├── design.schema.json        # 技术设计schema
│   │   └── testcases.schema.yaml     # 测试用例schema
│   ├── settings.json                # Claude Code设置
│   └── cache/                       # 缓存目录
│       └── feature_state.json       # 特性状态缓存
├── .taskmaster/                     # Task Master集成
│   ├── tasks/                       # 任务定义
│   └── state.json                   # Task Master状态
├── docs/                            # 文档目录
│   ├── prd/                         # 产品需求文档
│   ├── analysis/                    # 需求分析结果
│   └── design/                      # 技术设计文档
├── tests/                           # 测试目录
│   ├── specs/                       # 测试用例规格
│   ├── unit/                        # 单元测试
│   └── integration/                 # 集成测试
└── .tdd-scaffold/                   # TDD脚手架配置
    ├── config.json                  # 项目配置
    ├── analysis.json                # 深度分析结果
    └── state.json                   # TDD状态
```

## 配置模板系统

### 内置项目模板

**Java Spring Boot**
```javascript
{
  "framework": "java-spring",
  "buildTool": "maven",
  "testFramework": "junit5",  
  "mockFramework": "mockito",
  "directories": {
    "src": "src/main/java",
    "test": "src/test/java",
    "resources": "src/main/resources"
  }
}
```

**Node.js Express**
```javascript
{
  "framework": "node-express",
  "buildTool": "npm",
  "testFramework": "jest",
  "mockFramework": "jest",
  "directories": {
    "src": "src",
    "test": "tests", 
    "config": "config"
  }
}
```

**Python Django**
```javascript
{
  "framework": "python-django", 
  "buildTool": "pip",
  "testFramework": "pytest",
  "mockFramework": "pytest-mock",
  "directories": {
    "src": "apps",
    "test": "tests",
    "config": "config"
  }
}
```

### 自定义模板

可通过MCP工具管理自定义项目模板：

```javascript
// 导出当前项目为模板
tdd_manage_profiles({
  action: "export",
  profileName: "my-custom-profile", 
  filePath: "/path/to/save/profile.json"
})

// 在新项目中导入模板
tdd_manage_profiles({
  action: "import",
  profileName: "my-custom-profile",
  filePath: "/path/to/profile.json"  
})
```

## 深度项目分析

MCP服务提供AI驱动的项目深度分析功能：

### 架构分析
- 自动检测项目架构模式（MVC、微服务、分层等）
- 识别设计模式使用情况
- 分析模块依赖关系和耦合度
- 评估代码组织结构

### 测试策略分析  
- 评估现有测试覆盖率和质量
- 推荐测试策略（单元测试、集成测试、E2E测试）
- 识别测试空白和风险点
- 建议测试工具和框架选择

### 技术栈分析
- 检测使用的框架和库版本
- 分析依赖兼容性和安全漏洞
- 推荐技术栈升级路径
- 评估技术债务

### 代码模式分析
- 识别常见代码异味
- 分析代码复杂度和可维护性
- 检测性能瓶颈点
- 推荐重构建议

## 会话状态管理

MCP服务支持跨Claude对话保持状态：

### 项目状态
- 当前TDD相位和活跃特性
- 项目配置和分析结果缓存
- TDD历史记录和相位转换日志
- 代码质量指标跟踪

### 会话持久化
```javascript
// 状态自动保存到用户缓存目录
const cacheDir = process.env.TDD_CACHE_DIR || os.homedir() + '/.cache/tdd-scaffold'

// 会话数据结构
{
  "projectRoot": "/path/to/project",
  "tddState": {
    "currentPhase": "RED",
    "currentFeature": "user-auth", 
    "phaseHistory": [...],
    "lastUpdated": "2024-01-01T12:00:00Z"
  },
  "projectInfo": {
    "profile": "java-spring",
    "analysisResult": {...},
    "testStrategy": {...}
  }
}
```

## 故障排除

### MCP服务问题

**服务无法启动**
```bash
# 检查Node.js版本
node --version  # 需要 >= 16.0.0

# 检查依赖安装
npm install

# 手动启动测试
node mcp-server/index.js
```

**Claude Desktop无法连接**
```bash
# 检查配置文件路径
# Windows: %APPDATA%\Claude\claude_desktop_config.json
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
# Linux: ~/.config/Claude/claude_desktop_config.json

# 检查配置格式
{
  "mcpServers": {
    "tdd-scaffold": {
      "command": "node",
      "args": ["path/to/mcp-server/index.js"],
      "env": {
        "TDD_CACHE_DIR": "path/to/cache"
      }
    }
  }
}
```

### 环境检查失败

```
❌ 环境检查失败
该TDD脚手架需要在Claude Code环境中运行

请确保：
1. 在Claude Code (claude.ai/code)中运行此命令  
2. 已安装并配置Task Master AI MCP
3. 项目已初始化.claude目录
4. MCP服务正常运行
```

### TDD相位错误

**相位切换被阻止**
```bash
# 检查当前TDD状态
tdd_get_status({ projectRoot: "/path/to/project" })

# 强制切换相位（谨慎使用）  
tdd_switch_phase({ 
  projectRoot: "/path/to/project",
  phase: "GREEN",
  force: true 
})
```

**文件路径验证失败**
```bash
# 检查文件路径是否符合当前相位规则
tdd_validate_path({
  projectRoot: "/path/to/project", 
  filePath: "src/main/java/User.java"
})
```

## API参考

### MCP工具完整列表

| 工具名称 | 描述 | 主要参数 |
|---------|-----|---------|
| `tdd_initialize` | 初始化TDD项目 | projectRoot, profile, force |
| `tdd_scan_project` | 扫描项目结构 | projectRoot, deep |
| `tdd_deep_analyze` | 深度分析项目 | projectRoot |
| `tdd_validate_env` | 验证环境配置 | projectRoot |
| `tdd_get_status` | 获取TDD状态 | projectRoot |
| `tdd_export_config` | 导出项目配置 | projectRoot, outputPath |
| `tdd_import_config` | 导入项目配置 | projectRoot, configPath |
| `tdd_export_analysis` | 导出分析结果 | projectRoot, outputPath |
| `tdd_import_analysis` | 导入分析结果 | projectRoot, analysisPath |
| `tdd_compare_analysis` | 比较分析结果 | projectRoot |
| `tdd_apply_analysis` | 应用分析结果 | projectRoot |
| `tdd_manage_profiles` | 管理配置模板 | action, profileName, filePath |
| `tdd_switch_phase` | 切换TDD相位 | projectRoot, phase, featureId |
| `tdd_create_feature` | 创建新特性 | projectRoot, featureId, description |
| `tdd_complete_phase` | 完成当前相位 | projectRoot, result |
| `tdd_validate_path` | 验证文件路径 | projectRoot, filePath |

### MCP资源列表

| 资源名称 | URI | 描述 |
|---------|-----|------|
| Project Profiles | `scaffold://profiles/{name}` | 项目配置模板 |
| Code Templates | `scaffold://templates/{type}/{name}` | 代码生成模板 |  
| Analysis Cache | `scaffold://analysis/{projectId}` | 项目分析结果缓存 |

## 开发指南

### 扩展MCP工具

```javascript
// 在 mcp-server/tools/ 下创建新工具文件
export async function handleMyCustomTool(args, sessionManager) {
  const { projectRoot, customParam } = args;
  
  // 获取或创建会话
  const session = await sessionManager.getOrCreateSession(projectRoot);
  
  // 实现工具逻辑
  const result = await myCustomLogic(customParam);
  
  // 更新会话状态（如需要）
  await sessionManager.updateSession(projectRoot, {
    customData: result
  });
  
  return {
    content: [{
      type: "text",
      text: `工具执行结果: ${JSON.stringify(result)}`
    }]
  };
}

// 在 mcp-server/tools/index.js 中注册工具
const TOOL_DEFINITIONS = [
  // ... 现有工具
  {
    name: 'tdd_my_custom_tool',
    description: '我的自定义工具',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: { type: 'string' },
        customParam: { type: 'string' }
      },
      required: ['projectRoot']
    },
    handler: handleMyCustomTool
  }
];
```

### 添加项目模板

```javascript
// 在 mcp-server/resources/profiles.js 中添加新模板
const BUILTIN_PROFILES = {
  // ... 现有模板
  'my-framework': {
    name: 'my-framework',
    displayName: 'My Custom Framework',
    framework: 'my-framework',
    buildTool: 'my-build-tool',
    testFramework: 'my-test-framework',
    directories: {
      src: 'src',
      test: 'test',
      config: 'config'
    },
    dependencies: ['dep1', 'dep2'],
    devDependencies: ['dev-dep1'],
    templates: {
      controller: 'my-controller.template',
      service: 'my-service.template',
      test: 'my-test.template'
    }
  }
};
```

### 自定义分析器

```javascript  
// 创建自定义项目分析器
class MyCustomAnalyzer {
  async analyze(projectRoot, config) {
    const analysis = {
      architecture: await this.analyzeArchitecture(projectRoot),
      testStrategy: await this.analyzeTestStrategy(projectRoot), 
      dependencies: await this.analyzeDependencies(projectRoot),
      codePatterns: await this.analyzeCodePatterns(projectRoot),
      customMetrics: await this.analyzeCustomMetrics(projectRoot)
    };
    
    return analysis;
  }
  
  async analyzeCustomMetrics(projectRoot) {
    // 实现自定义分析逻辑
    return {
      metric1: 'value1',
      metric2: 'value2'
    };
  }
}

// 注册分析器
analysisEngine.registerAnalyzer('my-custom', new MyCustomAnalyzer());
```

## 版本历史

### v2.0.0 (2024-01-01)
- 🎉 新增完整MCP服务支持
- ✨ 实现会话状态管理和持久化  
- ✨ 新增TDD相位管理和自动化质量门禁
- ✨ 深度项目分析和AI驱动的架构评估
- ✨ 自动化MCP服务安装和配置脚本
- ✨ 17个专业MCP工具覆盖完整TDD生命周期
- ✨ 三层资源系统(profiles, templates, analysis-cache)
- 🐛 修复了多个CLI模式下的兼容性问题
- 📚 完全重写文档和使用指南

### v1.x (历史版本)
- CLI模式的基础TDD脚手架功能
- 项目初始化和配置管理
- 基础的Task Master集成

## 贡献指南

欢迎参与TDD Scaffold的开发！

### 开发环境配置

```bash
# 克隆仓库
git clone <repository-url>
cd claude-tdd-scaffold

# 安装开发依赖
npm install

# 运行测试套件  
npm test

# 启动开发模式MCP服务
npm run dev:mcp

# 代码风格检查
npm run lint

# 构建文档
npm run docs
```

### 提交规范

使用Conventional Commits格式：

```
feat(mcp): 添加新的MCP工具
fix(tdd): 修复TDD相位切换问题  
docs(readme): 更新API文档
test(unit): 增加单元测试覆盖率
```

### Pull Request流程

1. Fork仓库并创建feature分支
2. 实现功能并添加测试  
3. 确保所有测试通过
4. 更新相关文档
5. 提交Pull Request并描述变更

## 社区和支持

- 📖 **文档**: 详细使用指南和API参考
- 🐛 **Issue跟踪**: GitHub Issues
- 💬 **讨论**: GitHub Discussions
- 📧 **邮件支持**: support@example.com

## 许可证

MIT License - 详见 LICENSE 文件

---

## 快速开始

### 5分钟体验TDD Scaffold v2.0

```bash
# 1. 安装MCP服务
git clone <repo> && cd claude-tdd-scaffold
npm install && node scripts/install-mcp.js

# 2. 重启Claude Desktop

# 3. 在Claude Code中使用
tdd_initialize({
  projectRoot: "/path/to/my-project", 
  profile: "java-spring"
})

# 4. 开始TDD开发
tdd_switch_phase({
  projectRoot: "/path/to/my-project",
  phase: "RED"
})

# 现在享受强制执行的高质量TDD开发流程吧！🎉
```

**让TDD成为你的编程习惯，让质量成为你的代码DNA！** 🚀