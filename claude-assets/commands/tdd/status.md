---
description: 显示TDD开发状态
allowed-tools: tdd_get_status, tdd_smart_command
---

## 📊 TDD开发状态

### 快速查看状态

通过智能命令或TDD工具查看当前开发状态：
- "查看TDD状态"
- "当前在哪个阶段"
- "项目进展如何"

### TDD命令参考

#### 初始化
- `/tdd:init` - 初始化TDD项目
- `/tdd:status` - 显示当前状态

#### TDD流程 (3阶段循环)
- `/tdd:red` - 编写失败测试
- `/tdd:green` - 最小实现  
- `/tdd:refactor` - 重构优化

### 工作流示例

```bash
# 标准TDD开发流程
/tdd:init           # 初始化TDD环境
/tdd:red           # 编写失败测试
/tdd:green         # 最小实现
/tdd:refactor      # 重构优化

# 查看进展
/tdd:status        # 检查当前状态
```

### TDD开发优势

- ✅ **质量保证**: 强制执行完整的TDD流程
- ✅ **阶段管理**: 严格的RED/GREEN/REFACTOR阶段控制
- ✅ **进度可视**: 清晰展示开发进展
- ✅ **智能提示**: AI驱动的开发指导
- ✅ **自动测试**: 代码变更后自动运行测试

### 故障排除

如果遇到问题：
1. 检查 `.claude/tdd-state.json` 文件是否存在
2. 重新初始化：`/tdd:init`
3. 使用智能命令："重置TDD状态"

---
**提示**: 使用 `/tdd:init` 初始化TDD项目，然后用 `/tdd:red` 开始第一个TDD循环！