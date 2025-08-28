# TDD 核心命令指南

## 简化的TDD开发流程

基于"MCP只做必须的事，让Claude做擅长的事"的设计理念，提供核心TDD命令支持。

## 核心TDD命令

### 初始化与状态管理

```bash
/tdd:init         # 初始化TDD环境
/tdd:status       # 查看当前TDD状态
```

### TDD三阶段循环

```bash
/tdd:red         # 🔴 RED阶段：编写失败测试
/tdd:green       # 🟢 GREEN阶段：最小实现通过测试
/tdd:refactor    # 🔧 REFACTOR阶段：重构代码质量
```

### 完成流程

```bash
/tdd:done        # ✅ 完成当前TDD循环
```

### 提交工具

```bash
/commit          # 📝 生成规范化提交信息并提交
```

## TDD状态管理

系统使用`.claude/tdd-state.json`管理TDD状态：

```json
{
  "currentPhase": "RED|GREEN|REFACTOR|READY",
  "featureId": "当前开发的功能ID",
  "timestamp": "2024-01-01T00:00:00Z",
  "description": "功能描述"
}
```

## 质量门控

TDD Guard根据当前阶段限制文件编辑权限：

- **RED阶段**: 只允许编辑测试文件 (`tests/`, `*.test.*`, `*.spec.*`)
- **GREEN阶段**: 只允许编辑生产代码 (`src/`, `lib/`, `main/`)
- **REFACTOR阶段**: 允许重构生产代码和文档，但不能修改测试
- **READY阶段**: 只能修改配置文件 (`.claude/`)

## 最佳实践

### TDD三法则
1. 在写出能够失败的单元测试之前，不允许写任何产品代码
2. 只允许写出刚好能够失败的单元测试，不能编译也算失败
3. 只允许写出刚好能够通过当前失败测试的产品代码

### 开发节奏
1. **测试先行**: 总是从编写失败测试开始
2. **最小实现**: 写刚好通过测试的最简实现
3. **质量重构**: 在保持测试绿色的前提下改善代码质量
4. **小步快跑**: 频繁提交，保持可工作状态

## 故障排除

如果TDD Guard阻止了操作：
- 检查当前阶段：`/tdd:status`
- 使用正确的阶段命令：`/tdd:red`, `/tdd:green`, `/tdd:refactor`
- 确保文件类型符合当前阶段要求
- 重新初始化：`/tdd:init`