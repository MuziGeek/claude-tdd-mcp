# Claude TDD MCP v0.1.0

专为Claude Code环境设计的轻量级TDD（测试驱动开发）MCP服务器，支持多特性并行开发的智能工作流管理。

🎉 **首个稳定版本** - 完整的多特性TDD工作流，智能意图识别，轻量高效

## 🚀 30秒快速开始

```bash
# 1. 一键安装并初始化
cd your-project
npx claude-tdd-mcp init --profile=auto

# 2. 重启Claude Desktop

# 3. 在Claude Code中使用
# 说："帮我开始TDD开发"
# 或使用智能命令：tdd_smart_command({input: "初始化项目"})

# 🎉 享受AI驱动的TDD开发流程！
```

## 📦 安装和配置

### NPM安装

```bash
# 全局安装（推荐）
npm install -g claude-tdd-mcp

# 项目内安装
npm install claude-tdd-mcp
```

### Claude Desktop配置

MCP服务会在初始化时自动配置，或手动添加到Claude Desktop配置：

**配置文件位置：**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "claude-tdd-mcp": {
      "command": "npx",
      "args": ["claude-tdd-mcp"]
    }
  }
}
```

## 🌟 核心特性

- ✅ **多特性并行开发** - 支持同时管理多个TDD特性，独立状态追踪
- ✅ **智能命令系统** - 自然语言执行TDD操作，支持特性管理指令
- ✅ **零配置初始化** - 自动检测项目类型并配置
- ✅ **TDD相位管理** - 严格执行RED/GREEN/REFACTOR循环
- ✅ **自动任务列表** - 生成features-list.md，可视化特性进度
- ✅ **轻量级架构** - MCP只做必需的事，让Claude发挥优势
- ✅ **跨对话状态** - 保持项目状态和配置
- ✅ **多项目支持** - Java Spring、Node.js、Python等

## 🛠 使用方法

### 智能命令系统（推荐）

```javascript
// 🤖 智能命令 - 使用自然语言
tdd_smart_command({
  projectRoot: "/path/to/project",
  input: "初始化项目"  // 或 "开始TDD", "red", "状态", "写测试" 等
})

// 🚀 多特性管理
tdd_smart_command({
  projectRoot: "/path/to/project", 
  input: "新功能 用户登录"  // 创建新特性
})

tdd_smart_command({
  projectRoot: "/path/to/project",
  input: "切换到 USER_AUTH"  // 切换特性
})

tdd_smart_command({
  projectRoot: "/path/to/project",
  input: "功能列表"  // 查看所有特性
})

// 查看所有可用命令别名
tdd_list_aliases()

// 获取智能命令帮助
tdd_smart_help()
```

### 核心MCP工具

```javascript
// 零配置初始化
tdd_auto_init_project({ projectRoot: "/path/to/project" })

// 切换TDD阶段
tdd_switch_phase({ projectRoot: "/path/to/project", phase: "RED" })

// 启动自动测试
tdd_start_auto_test({ projectRoot: "/path/to/project" })

// 项目状态
tdd_enhanced_status({ projectRoot: "/path/to/project" })
```

### CLI命令

```bash
# 初始化项目
npx claude-tdd-mcp init /path/to/project

# 检测项目类型
npx claude-tdd-mcp detect /path/to/project

# 环境验证
npx claude-tdd-mcp validate /path/to/project
```

## 📊 支持的项目类型

| 项目类型 | Profile | 测试框架 | 构建工具 |
|---------|---------|---------|---------|
| Java Spring Boot | `java-spring` | JUnit 5 | Maven |
| Node.js Express | `node-express` | Jest | npm |
| Python Django | `python-django` | pytest | pip |
| JavaScript/TypeScript | `javascript` | Jest | npm |
| 自动检测 | `auto` | 自动选择 | 自动选择 |

## 🔄 TDD工作流

### TDD三相位循环

- **🔴 RED相位** - 编写失败测试，只能修改测试文件
- **🟢 GREEN相位** - 最小实现，只能修改生产代码
- **🔧 REFACTOR相位** - 重构优化，保持测试通过

### 自动化质量门禁

- **路径验证** - 根据TDD相位限制可编辑文件
- **自动测试** - 代码变更后智能运行测试
- **状态跟踪** - 记录TDD历史和进度

## 🔧 MCP工具完整列表

| 分类 | 工具名称 | 描述 |
|------|---------|------|
| **智能命令** | `tdd_smart_command` | 🤖 自然语言执行TDD操作 |
|  | `tdd_list_aliases` | 📋 显示命令别名 |
|  | `tdd_smart_help` | ❓ 智能命令帮助 |
| **项目管理** | `tdd_auto_init_project` | 🚀 零配置初始化 |
|  | `tdd_initialize` | 🚀 手动初始化项目 |
|  | `tdd_scan_project` | 🔍 扫描项目结构 |
|  | `tdd_deep_analyze` | 🧠 深度分析项目 |
| **TDD工作流** | `tdd_switch_phase` | 🔄 切换TDD阶段 |
|  | `tdd_create_feature` | 🎯 创建新特性 |
|  | `tdd_validate_path` | 🛡️ 验证文件路径 |
| **自动测试** | `tdd_start_auto_test` | 🤖 启动自动测试 |
|  | `tdd_trigger_test` | ▶️ 手动触发测试 |
|  | `tdd_get_test_result` | 📊 获取测试结果 |
| **状态管理** | `tdd_enhanced_status` | 📊 增强状态信息 |
|  | `tdd_project_health` | 🏥 项目健康度 |
|  | `tdd_status_dashboard` | 📈 状态仪表盘 |

完整工具列表请查看 [API参考](#api参考)

## 🆘 故障排除

### 看不到TDD工具
```bash
# 1. 重启Claude Desktop
# 2. 检查包安装
npm list -g claude-tdd-mcp
# 3. 重新安装
npm install -g claude-tdd-mcp
```

### TDD阶段切换失败
在Claude Code中说："重置TDD状态" 或使用：
```javascript
tdd_validate_env({ projectRoot: "/path/to/project" })
```

### 测试运行失败
```bash
# 检查开发环境
mvn --version    # Java
npm --version    # Node.js
python --version # Python
```

## 📚 完整文档

- 📖 [用户操作指南](docs/user-guide/USER-GUIDE.md) - 详细使用说明
- ⚡ [快速开始指南](docs/user-guide/QUICK-START.md) - 30秒快速上手
- 🔄 [TDD工作流详解](docs/user-guide/TDD-WORKFLOW.md) - 深入理解TDD

## 🔗 环境要求

- Claude Code (claude.ai/code)
- Claude Desktop (用于MCP服务)
- Node.js >= 16.0.0
- 对应开发环境（Java/Maven, Node.js/npm, Python/pip等）

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献和支持

- 📖 **文档**: 详细使用指南和API参考
- 🐛 **Issue跟踪**: [GitHub Issues](https://github.com/MuziGeek/claude-tdd-mcp/issues)
- 💬 **讨论**: [GitHub Discussions](https://github.com/MuziGeek/claude-tdd-mcp/discussions)

---

**让AI成为你的TDD伙伴，让质量成为你的代码DNA！** 🤖✨