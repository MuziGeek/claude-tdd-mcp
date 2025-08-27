---
description: 完成模块化特性开发（清理状态和总结）
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(jq:*), Bash(rm:*)
argument-hint: [module] [FEATURE_ID]
---

!`bash -lc 'MODULE=$(echo "$ARGUMENTS" | cut -d" " -f1); FEATURE=$(echo "$ARGUMENTS" | cut -d" " -f2); jq -c ".featureId=\\\"$FEATURE\\\"|.module=\\\"$MODULE\\\"|.stage=\\\"complete\\\"|.completedAt=\\\"$(date -Iseconds)\\\"" .claude/cache/feature_state.json > .claude/cache/tmp && mv .claude/cache/tmp .claude/cache/feature_state.json'`

## 🎉 模块化特性开发完成

**模块**: $(echo "$ARGUMENTS" | cut -d" " -f1)  
**特性**: $(echo "$ARGUMENTS" | cut -d" " -f2)

### 完成检查清单

请确认以下所有项目都已完成：

- [ ] **PRD文档**: `docs/prd/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).prd.md`
- [ ] **需求分析**: `docs/analysis/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).requirements.md`
- [ ] **技术设计**: `docs/design/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).design.md`
- [ ] **测试规格**: `tests/specs/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).test.md`
- [ ] **TDD实现**: 所有测试通过（RED→GREEN→REFACTOR）
- [ ] **代码审查**: 代码质量符合项目标准
- [ ] **模块集成**: 与其他模块的接口正常工作
- [ ] **文档更新**: API文档和使用说明已更新

### 质量验证

运行以下命令进行最终验证：

```bash
# 运行模块测试
/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test -pl yichao-module-$(echo "$ARGUMENTS" | cut -d" " -f1)

# 代码质量检查
/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd checkstyle:check -pl yichao-module-$(echo "$ARGUMENTS" | cut -d" " -f1)

# 完整构建验证
/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd clean compile test
```

### 提交和部署

如果所有检查通过，可以：

1. **提交代码**:
```bash
powershell.exe -Command "cd D:\GitProject\yichao; git add .; git commit -m 'feat($(echo "$ARGUMENTS" | cut -d" " -f1)): 完成 $(echo "$ARGUMENTS" | cut -d" " -f2) 功能'"
```

2. **创建Pull Request**（如果使用Git Flow）
3. **更新项目文档**
4. **通知相关团队成员**

### 清理工作

特性状态已更新为完成。可以：
- 开始下一个特性开发：`/feature:init-module <module> <next_feature>`
- 切换到其他模块：`/feature:init-module <other_module> <feature>`

---
**特性状态**: $(echo "$ARGUMENTS" | cut -d" " -f2) | 模块: $(echo "$ARGUMENTS" | cut -d" " -f1) | 阶段: complete ✅