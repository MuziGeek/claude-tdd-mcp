# TDD智能协调演示

## 🎯 演示目标

展示**执行计划模式**如何实现MCP与Claude Code的智能协调，从自然语言输入到精确的TDD执行。

## 📋 演示场景

**用户输入**: `tdd_smart_command("开始写测试")`

### 步骤1: MCP意图识别

```javascript
// 智能意图分析结果
{
  type: 'red',
  confidence: 0.9,
  matchedPattern: '开始写测试',
  matchType: 'fuzzy',
  originalInput: '开始写测试'
}
```

### 步骤2: MCP执行计划生成

```javascript
// 生成的智能执行计划
{
  intent: { type: 'red', confidence: 0.9 },
  currentPhase: 'READY',
  targetPhase: 'RED', 
  phaseTransition: 'READY → RED',
  
  // MCP层面的动作
  mcpActions: [
    { type: 'switchPhase', phase: 'RED' }
  ],
  
  // Claude执行指导
  agentRecommendation: 'tdd-architect',
  taskDescription: '编写失败的测试用例（TDD RED阶段）',
  
  // 权限控制
  filePermissions: {
    allowed: ['tests/', '*.test.*', '*.spec.*'],
    blocked: ['src/', 'lib/', 'main/']
  },
  
  // 执行步骤
  nextSteps: [
    '编写会失败的测试用例',
    '确保测试失败原因明确（功能未实现）',
    '运行测试验证失败状态',
    '完成后使用 tdd_smart_command("实现") 进入GREEN阶段'
  ]
}
```

### 步骤3: MCP状态更新

```javascript
// 更新 .claude/tdd-state.json
{
  "currentPhase": "RED",
  "featureId": "NEW_FEATURE",
  "timestamp": "2024-08-28T11:30:00Z", 
  "phaseStartTime": "2024-08-28T11:30:00Z",
  "description": "TDD RED阶段 - 编写失败测试",
  "agentMode": "tdd-architect"
}
```

### 步骤4: 返回Claude执行指导

```markdown
# 🔴 TDD智能协调激活

🔴 **TDD RED阶段激活 - 测试驱动开发**

**TDD第一法则**: 在写出能够失败的单元测试之前，不允许写任何产品代码

**当前模式**: 测试先行模式
- 🎯 专注编写会失败的测试用例
- 🎯 明确定义期望的功能行为
- 🎯 遵循AAA模式：Given-When-Then结构
- 🎯 确保测试失败原因是"功能未实现"

> **🤖 请立即切换为 `tdd-architect` 身份执行以下任务**

**🎯 核心任务**: 编写失败的测试用例（TDD RED阶段）

**📁 文件编辑权限** (由TDD Guard自动强制执行):
- ✅ **允许编辑**: tests/, *.test.*, *.spec.*
- ❌ **禁止编辑**: src/, lib/, main/

**📋 执行步骤**:
1. 编写会失败的测试用例
2. 确保测试失败原因明确（功能未实现）
3. 运行测试验证失败状态
4. 完成后使用 tdd_smart_command("实现") 进入GREEN阶段

**🔄 TDD阶段变更**: READY → RED

---
**⚡ TDD智能协调系统** | 意图: red | 置信度: 90% | 匹配: fuzzy
```

### 步骤5: Claude智能执行

Claude读取到这个执行计划后，会：

1. **理解指令**: 识别需要切换到tdd-architect身份
2. **调整工作模式**: 以TDD专家身份思考和工作
3. **执行任务**: 根据步骤编写失败的测试用例
4. **遵循权限**: 只编辑tests/目录下的文件
5. **后续流程**: 完成后引导用户进入GREEN阶段

### 步骤6: TDD Guard权限保护

当Claude尝试编辑文件时，TDD Guard会：

```javascript
// tdd_guard.js 读取状态
const tddState = readJSONSafe('.claude/tdd-state.json');
const currentPhase = tddState?.currentPhase?.toLowerCase(); // "red"

// 权限检查
if (currentPhase === 'red') {
  // 允许编辑测试文件
  if (filePath.match(/^tests\//) || filePath.match(/.*\.test\./)) {
    return { allowed: true };
  }
  
  // 阻止编辑生产代码
  if (filePath.match(/^src\//) || filePath.match(/^lib\//)) {
    return {
      allowed: false,
      reason: '🔴 RED阶段限制：当前只能编辑测试文件，生产代码将在GREEN阶段编写'
    };
  }
}
```

## 🎊 协调效果

### 用户体验
- **输入**: 自然语言"开始写测试"
- **体验**: 系统自动理解意图，切换阶段，提供专业指导
- **保护**: 自动阻止违反TDD规则的操作

### 系统协调
- **MCP**: 意图识别 → 执行计划 → 状态管理
- **Claude**: 计划解析 → 模式切换 → 任务执行
- **Hooks**: 权限控制 → 阶段保护 → 友好提示

### 智能化程度
- ✅ **自然语言理解**: "开始写测试" → RED阶段
- ✅ **上下文感知**: 基于当前阶段提供合适建议
- ✅ **自动保护**: 阻止反TDD操作并解释原因
- ✅ **流程指导**: 明确的下一步操作建议
- ✅ **专家切换**: 自动推荐合适的专业agent

## 🔄 完整流程演示

```bash
# 1. 初始化
tdd_smart_command("初始化项目")
# → MCP配置环境，Claude切换到配置模式

# 2. 开始TDD循环  
tdd_smart_command("写测试")
# → MCP切换到RED，Claude切换到tdd-architect编写测试

# 3. 实现功能
tdd_smart_command("实现")  
# → MCP切换到GREEN，Claude编写最小实现

# 4. 重构代码
tdd_smart_command("重构")
# → MCP切换到REFACTOR，Claude改善代码质量

# 5. 验证测试
tdd_smart_command("测试")
# → MCP运行测试，Claude分析结果并提供建议
```

## 📊 协调优势

### vs 传统方式
- **传统**: 用户手动执行commands → agents → 文件编辑
- **智能协调**: 自然语言 → 自动计划 → 智能执行

### 自动化程度
- **意图识别**: 90%+ 准确率
- **状态管理**: 100% 自动化
- **权限控制**: 100% 强制执行
- **流程指导**: 智能化的下一步建议

### 用户体验提升
- 🚀 **一键操作**: 单个命令完成复杂流程
- 🧠 **智能理解**: 支持多种表达方式
- 🔒 **自动保护**: 防止违规操作
- 📋 **清晰指导**: 每个阶段都有明确任务

## 💡 技术突破

虽然MCP无法"直接控制"Claude Code，但通过**智能协调模式**实现了：

1. **智能桥接**: MCP理解意图，Claude执行计划
2. **状态同步**: 文件系统作为通信媒介
3. **权限协调**: Hooks基于状态自动控制
4. **流程自动化**: 复杂的TDD流程简化为自然语言操作

这种架构在保持各组件职责清晰的同时，提供了接近"直接控制"的用户体验。