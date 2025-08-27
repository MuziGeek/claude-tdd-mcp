---
description: 初始化TDD任务，将Task Master任务转换为TDD工作流
allowed-tools: Bash(printf:*), Bash(node:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), mcp__task-master-ai__*
---

## 🚀 初始化TDD任务

### 功能说明
将指定的Task Master任务转换为TDD工作流，自动生成设计、红绿重构四个阶段的子任务。

### 使用方法
```bash
/tm:init <task-id>
```

### 参数说明
- `task-id`: Task Master中的任务ID（必需）

### 执行逻辑

!`bash -c 'TASK_ID="${1:-}"; if [ -z "$TASK_ID" ]; then echo "❌ 错误：必须提供任务ID"; echo "用法: /tm:init <task-id>"; exit 1; fi; echo "🚀 正在初始化TDD任务 #$TASK_ID..."; node .claude/scripts/tdd-task-integration.js init "$TASK_ID" && echo "✅ TDD任务初始化完成！" || echo "❌ TDD任务初始化失败"'`

### 执行结果
- 为指定任务创建4个TDD子任务：
  - `[DESIGN]` - 需求分析和技术设计
  - `[RED]` - 编写失败测试
  - `[GREEN]` - 最小实现
  - `[REFACTOR]` - 重构优化
- 创建TDD任务状态文件
- 设置任务间依赖关系

### 示例
```bash
/tm:init 1
```
这将为任务#1创建完整的TDD工作流子任务。

### 注意事项
- 任务ID必须存在于Task Master中
- 如果任务已有子任务，TDD子任务将追加到现有子任务列表
- 初始化后可使用 `/tm:design`, `/tm:red`, `/tm:green`, `/tm:refactor` 进入各个阶段

---
**下一步**: 使用 `/tm:design <task-id>` 开始需求分析和技术设计阶段