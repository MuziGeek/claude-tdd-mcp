---
description: 进入模块化 PRD 产出阶段（product-manager）
allowed-tools: Bash(printf:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(jq:*)
argument-hint: [module] [FEATURE_ID]
---

!`bash -lc 'MODULE=$(echo "$ARGUMENTS" | cut -d" " -f1); FEATURE=$(echo "$ARGUMENTS" | cut -d" " -f2); jq -c ".featureId=\\\"$FEATURE\\\"|.module=\\\"$MODULE\\\"|.stage=\\\"pm\\\"" .claude/cache/feature_state.json 2>/dev/null || printf "{\\\"featureId\\\":\\\"$FEATURE\\\",\\\"module\\\":\\\"$MODULE\\\",\\\"stage\\\":\\\"pm\\\",\\\"tdd\\\":\\\"red\\\"}" > .claude/cache/feature_state.json'`

## 当前阶段：模块化 PRD 产出

> 仅由 **product-manager** 子代理响应以下任务：

### 任务目标  
请创建/完善：`docs/prd/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).prd.md`

### 模块上下文
- **目标模块**: $(echo "$ARGUMENTS" | cut -d" " -f1)
- **功能特性**: $(echo "$ARGUMENTS" | cut -d" " -f2)
- **模块职责**: 参考 `.claude/config/modules.json` 中的模块定义

### 必须包含的章节  
- **背景与目标**: 模块业务背景、用户痛点、产品目标
- **用户画像**: 目标用户群体、使用场景
- **功能范围**: 明确的功能边界和非功能范围（考虑模块边界）
- **核心场景**: 主要用户流程和关键路径
- **模块集成**: 与其他模块的交互点和依赖关系  
- **验收标准**: Gherkin Given-When-Then 格式或清单式标准
- **KPI/指标**: 可量化的成功指标
- **风险与假设**: 潜在风险和前提假设
- **里程碑**: 关键交付节点和时间安排

### 模块化质量要求
- 语言明确、可测量、避免实现细节
- 验收标准必须可测试和验证
- 边界明确：说明模块内什么在范围内，什么不在
- 考虑模块间的接口和数据流
- 每个功能点都有明确的验收标准

### 完成标志
PRD 文档完成后，请使用 `/feature:analyze-module $ARGUMENTS` 进入需求分析阶段。

---
**特性状态**: $(echo "$ARGUMENTS" | cut -d" " -f2) | 模块: $(echo "$ARGUMENTS" | cut -d" " -f1) | 阶段: pm | 允许编辑: docs/prd/$(echo "$ARGUMENTS" | cut -d" " -f1)/**