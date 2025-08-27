---
description: 生成规范化提交信息并提交
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(powershell.exe:*), Bash(printf:*)
---

## 📝 规范化Git提交

### 提交信息格式

基于当前改动生成 **Conventional Commits** 风格的提交信息：

#### 提交类型
- `feat(scope)`: 新功能
- `fix(scope)`: 错误修复  
- `test(scope)`: 添加或修改测试
- `refactor(scope)`: 代码重构（不改变功能）
- `docs(scope)`: 文档更新
- `style(scope)`: 代码格式调整
- `perf(scope)`: 性能优化
- `build(scope)`: 构建系统或依赖更新
- `ci(scope)`: CI/CD配置更新

#### 提交消息结构
```
<type>(<scope>): <summary>

<detailed description>

主要完成内容：
- 功能模块A的具体实现
- 技术亮点和创新点
- 测试覆盖情况

技术实现：
- 架构设计决策
- 关键技术选型
- 性能优化措施

质量保证：
- 测试覆盖率：XX%
- 代码质量指标
- 安全性考虑

追溯关系：
- 关联需求: REQ-001, REQ-002
- 关联用例: TC-001, TC-005
- 解决问题: #123, #456

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### 自动提交流程

#### 1. 检查变更状态
!`git status --porcelain`

#### 2. 暂存所有变更
!`git add .`

#### 3. 生成提交消息
基于以下信息生成详细提交消息：
- **变更范围**: 从git diff分析修改的文件和模块
- **功能描述**: 根据代码变更推断功能意图
- **技术细节**: 关键实现点和技术决策
- **质量信息**: 测试覆盖、代码质量、性能影响
- **追溯关系**: 关联的需求、用例、问题单号

#### 4. 执行提交
使用详细的多行提交消息，遵循项目标准：

**Windows环境提交**（推荐）:
```bash
powershell.exe -Command "cd D:\GitProject\yichao; git commit -m 'Generated detailed commit message'"
```

**WSL环境提交**（备选）:
```bash  
git commit -m "Generated detailed commit message"
```

### 提交质量要求

#### 必须包含的信息
- **变更概述**: 简洁的变更摘要
- **实现细节**: 具体的技术实现
- **测试情况**: 测试覆盖和验证结果
- **影响范围**: 变更对系统的影响
- **关联信息**: 需求、用例、问题的追溯

#### 质量检查清单
- [ ] 提交信息详细完整
- [ ] 遵循Conventional Commits规范
- [ ] 包含技术亮点和实现细节
- [ ] 说明测试覆盖情况
- [ ] 体现追溯关系
- [ ] 使用中文描述（项目要求）

### 分析变更并生成提交

请分析当前的git变更，包括：
1. **文件变更分析**: 修改了哪些文件和模块
2. **功能影响评估**: 这些变更实现了什么功能
3. **技术实现总结**: 关键的技术点和设计决策
4. **质量保证说明**: 测试、性能、安全等方面
5. **追溯关系梳理**: 与需求、用例、问题的关联

然后生成符合项目标准的详细提交信息并执行提交。

---
**提交原则**: 详细 > 简洁 | 追溯 > 孤立 | 质量 > 速度