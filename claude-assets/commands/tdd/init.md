---
description: 初始化TDD项目环境
allowed-tools: tdd_init_project, tdd_smart_command
---

## 🚀 初始化TDD项目

### 功能说明
初始化TDD开发环境，检测项目类型并设置完整的TDD开发流程。

### 使用方法
```bash
/tdd:init
```

或者使用智能命令：
- "初始化TDD项目"
- "设置TDD环境"
- "开始 TDD 开发"

### 执行逻辑

自动执行初始化流程：
1. 检测项目类型（Java/Node.js/Python）
2. 创建 TDD 配置和状态文件
3. 设置项目结构和测试命令
4. 配置 TDD 阶段规则

### 执行结果
- 创建 `.claude/settings.json` - TDD 配置文件
- 创建 `.claude/tdd-state.json` - TDD 状态跟踪
- 设置 TDD 三阶段规则：
  - `RED` - 编写失败测试
  - `GREEN` - 最小实现
  - `REFACTOR` - 重构优化
- 配置项目特定的测试命令

### 示例
```bash
/tdd:init
```
这将为当前项目创建完整的TDD开发环境。

### 注意事项
- 必须在项目根目录中执行
- 支持自动检测 Java、Node.js、Python 项目
- 初始化后可使用 `/tdd:red`、`/tdd:green`、`/tdd:refactor` 进入各个阶段
- 支持智能命令进行 TDD 阶段管理

---
**下一步**: 使用 `/tdd:red` 开始TDD开发的第一个阶段