---
description: 显示TDD-Task Master集成状态
allowed-tools: Bash(printf:*), Bash(node:*), mcp__task-master-ai__*
---

!`bash -c 'node .claude/scripts/tdd-task-integration.js status 2>/dev/null || echo "⚠️  无法读取TDD状态，可能尚未初始化"'`

## 📊 TDD-Task Master 集成状态

### 快速操作

```bash
# 查看当前所有任务
task-master list

# 查看下一个可执行任务  
task-master next

# 查看特定任务详情
task-master show <task-id>
```

### TDD命令参考

#### 任务管理
- `/tdd:init <task-id>` - 初始化TDD任务
- `/tdd:status` - 显示当前状态

#### TDD流程 (3阶段循环)
- `/tdd:red [task-id]` - 编写失败测试
- `/tdd:green [task-id]` - 最小实现  
- `/tdd:refactor [task-id]` - 重构优化
- `/tdd:done <task-id>` - 标记任务完成

### 工作流示例

```bash
# 统一的TDD任务流程 (3阶段)
/tdd:init 1          # 初始化任务#1
/tdd:red 1          # 编写失败测试
/tdd:green 1        # 最小实现
/tdd:refactor 1     # 重构优化
/tdd:done 1         # 标记完成

# 查看进展
/tdd:status         # 检查当前状态
task-master next   # 获取下一任务
```

### 集成优势

- ✅ **任务驱动**: 每个功能都有对应的Task Master任务
- ✅ **状态同步**: TDD阶段自动同步到任务状态
- ✅ **进度可视**: 清晰展示开发进展
- ✅ **质量保证**: 强制执行完整的TDD流程
- ✅ **团队协作**: 支持多人并行开发

### 故障排除

如果遇到问题：
1. 检查 `.claude/cache/` 目录是否存在
2. 确认Task Master任务存在：`task-master list`
3. 重新初始化：`/tdd:init <task-id>`

---
**提示**: 使用 `/tdd:init <task-id>` 初始化TDD任务，然后用 `/tdd:red <task-id>` 开始第一个TDD循环！