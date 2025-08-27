---
description: 进入模块化需求分析与技术设计阶段
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(jq:*)
argument-hint: [module] [feature_id]
---

!`bash -lc 'MODULE=$(echo "$ARGUMENTS" | cut -d" " -f1); FEATURE=$(echo "$ARGUMENTS" | cut -d" " -f2); jq -c ".featureId=\\\"$FEATURE\\\"|.module=\\\"$MODULE\\\"|.stage=\\\"analysis\\\"" .claude/cache/feature_state.json > .claude/cache/tmp && mv .claude/cache/tmp .claude/cache/feature_state.json'`

# /feature:analyze-module

Switch to Analysis mode for a specific module feature.

## Command
`/feature:analyze-module [module] [feature_id]`

## Parameters
- `module`: Module name (customer, tenant, goods, sales, etc.)
- `feature_id`: Feature identifier

## Example
```
/feature:analyze-module customer USER_PROFILE
/feature:analyze-module tenant HIERARCHY_MGMT
```

## 当前阶段：模块化需求分析与技术设计

> 仅由 **prd-analyzer-designer** 子代理响应以下任务：

### 输入材料
- 读取：`docs/prd/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).prd.md`

### 输出交付物

#### 1. 模块化结构化需求分析  
**文件**: `docs/analysis/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).requirements.md`

必须包含字段（考虑模块上下文）：
- `featureId`: 功能标识符
- `module`: 所属模块
- `goals[]`: 业务目标列表  
- `scope{in[], out[]}`: 明确的范围界定（模块内/外边界）
- `userStories[]`: 用户故事 `{id, as, iWant, soThat, acceptance[]}`
- `moduleInterfaces[]`: 与其他模块的接口定义
- `nonFunctional[]`: 非功能需求 `{id, type, criteria}`
- `constraints[]`: 技术和业务约束
- `risks[]`: 风险识别
- `openQuestions[]`: 待澄清问题

#### 2. 模块化技术设计文档
**文件**: `docs/design/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).design.md`

必须包含章节：
- **模块系统上下文**: 模块边界、外部系统集成点
- **模块内组件架构**: 核心组件和职责划分
- **模块数据模型**: 实体关系和数据流
- **模块接口契约**: API设计和协议定义  
- **跨模块时序图**: 关键业务流程和模块交互
- **错误处理**: 异常场景和重试策略
- **观测性设计**: 日志、指标、链路追踪
- **迁移策略**: 数据迁移和向后兼容
- **模块可测试性**: 如何从外部观测验收标准的满足情况

### 模块化质量要求
- 所有需求必须结构化，便于后续自动化处理
- 每个设计决策都要考虑模块边界和可测试性
- 技术风险前置识别和量化
- 接口设计清晰，遵循项目规范
- 明确模块间的依赖关系和数据流

### 完成标志  
分析和设计文档完成后，请使用 `/feature:cases-module $ARGUMENTS` 进入测试用例设计阶段。

---
**特性状态**: $(echo "$ARGUMENTS" | cut -d" " -f2) | 模块: $(echo "$ARGUMENTS" | cut -d" " -f1) | 阶段: analysis | 允许编辑: docs/analysis/$(echo "$ARGUMENTS" | cut -d" " -f1)/**, docs/design/$(echo "$ARGUMENTS" | cut -d" " -f1)/**