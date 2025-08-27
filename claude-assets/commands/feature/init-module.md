---
description: 初始化模块化新特性骨架，参数：<module> <FEATURE_ID>
allowed-tools: Bash(mkdir:*), Bash(printf:*), Bash(cp:*), Bash(git add:*), Bash(git status:*), Bash(git commit:*)
argument-hint: [module] [FEATURE_ID]
---

!`bash -lc 'MODULE=$(echo "$ARGUMENTS" | cut -d" " -f1); FEATURE=$(echo "$ARGUMENTS" | cut -d" " -f2); mkdir -p docs/prd/$MODULE docs/analysis/$MODULE docs/design/$MODULE tests/specs/$MODULE tests/unit tests/integration src .claude/cache'`
!`bash -lc 'MODULE=$(echo "$ARGUMENTS" | cut -d" " -f1); FEATURE=$(echo "$ARGUMENTS" | cut -d" " -f2); printf "{\\\"featureId\\\":\\\"$FEATURE\\\",\\\"module\\\":\\\"$MODULE\\\",\\\"stage\\\":\\\"pm\\\",\\\"tdd\\\":\\\"red\\\",\\\"paths\\\":{\\\"prd\\\":\\\"docs/prd/$MODULE/$FEATURE.prd.md\\\",\\\"analysis\\\":\\\"docs/analysis/$MODULE/$FEATURE.requirements.md\\\",\\\"design\\\":\\\"docs/design/$MODULE/$FEATURE.design.md\\\",\\\"tests\\\":\\\"tests/specs/$MODULE/$FEATURE.test.md\\\"}}" > .claude/cache/feature_state.json'`

已创建模块化特性骨架：**$ARGUMENTS**。

## 下一步操作

请使用 `/feature:pm-module $ARGUMENTS` 命令进入 PRD 产出阶段。

## 特性状态

- **模块**: $(echo "$ARGUMENTS" | cut -d" " -f1)
- **特性ID**: $(echo "$ARGUMENTS" | cut -d" " -f2)  
- **当前阶段**: pm (PRD编写)
- **TDD状态**: red
- **PRD目标文件**: `docs/prd/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).prd.md`

## 模块化工作流程

1. **PRD阶段** (`/feature:pm-module`) - 产品经理编写需求文档
2. **分析阶段** (`/feature:analyze-module`) - 需求分析和技术设计  
3. **用例阶段** (`/feature:cases-module`) - 测试用例设计
4. **实现阶段** (`/tdd:implement`) - TDD开发实现

## 目录结构

已创建以下模块化目录结构：
- `docs/prd/$(echo "$ARGUMENTS" | cut -d" " -f1)/` - PRD文档
- `docs/analysis/$(echo "$ARGUMENTS" | cut -d" " -f1)/` - 需求分析文档
- `docs/design/$(echo "$ARGUMENTS" | cut -d" " -f1)/` - 技术设计文档  
- `tests/specs/$(echo "$ARGUMENTS" | cut -d" " -f1)/` - 测试规格文档

特性状态已保存到 `.claude/cache/feature_state.json`，TDD守卫将根据模块上下文控制文件访问权限。