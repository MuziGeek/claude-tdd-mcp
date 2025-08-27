# /feature:cases-module

Switch to Test Cases mode for a specific module feature.

## Command
`/feature:cases-module [module] [feature_id]`

## Parameters
- `module`: Module name (customer, tenant, goods, sales, etc.)
- `feature_id`: Feature identifier

## Example
```
/feature:cases-module customer USER_PROFILE
/feature:cases-module tenant HIERARCHY_MGMT
```

## 当前阶段：模块化测试用例产出

> 仅由 **test-case-generator** 子代理响应以下任务：

### 输入材料
- 读取：`docs/analysis/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).requirements.md`  
- 读取：`docs/design/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).design.md`

### 输出交付物
**文件**: `tests/specs/$(echo "$ARGUMENTS" | cut -d" " -f1)/$(echo "$ARGUMENTS" | cut -d" " -f2).test.md`

必须符合模块化测试结构：

```yaml
featureId: $(echo "$ARGUMENTS" | cut -d" " -f2)
module: $(echo "$ARGUMENTS" | cut -d" " -f1)
suites:
  - name: "模块内单元测试"
    scope: "module-internal"
    cases:
      - id: "TC001"
        title: "模块服务测试"
        type: unit
        module: $(echo "$ARGUMENTS" | cut -d" " -f1)
        
  - name: "模块间集成测试"  
    scope: "cross-module"
    cases:
      - id: "TC101"
        title: "模块接口测试"
        type: integration
        dependencies: ["other_module"]
        
  - name: "端到端业务流程测试"
    scope: "e2e"
    cases:
      - id: "TC201"
        title: "完整业务流程测试"
        type: e2e
        modules: ["$(echo "$ARGUMENTS" | cut -d" " -f1)", "dependent_modules"]
```

### 模块化设计要求

#### 覆盖维度
- **模块内功能覆盖**: 所有模块内用户故事和验收标准
- **模块间接口覆盖**: 跨模块的接口和数据流  
- **模块边界覆盖**: 边界值、权限、异常处理
- **模块数据覆盖**: 模块内数据一致性和跨模块数据同步
- **模块集成覆盖**: 与其他模块和外部系统的集成

#### 测试类型分层（模块化）
- **Module Unit（模块单元测试）**: 模块内组件逻辑，P0-P1
- **Module Integration（模块集成测试）**: 模块间交互，P1-P2
- **Cross-Module E2E（跨模块端到端测试）**: 完整业务流程，P0-P1  
- **Module Contract（模块契约测试）**: 模块API接口规范，P1

#### 优先级划分
- **P0（阻塞级）**: 模块核心功能，发布门槛
- **P1（重要级）**: 模块主要功能和接口，回归必测
- **P2（一般级）**: 模块边界场景，时间允许时执行
- **P3（可选级）**: 模块优化场景，自动化回归

### 模块化质量要求
- 每个测试用例可通过 `trace` 追溯到需求
- 步骤描述清晰、可操作  
- 测试数据具体、可重复
- 预期结果明确、可验证
- 覆盖模块内正向、负向、跨模块交互测试场景
- 明确标识模块依赖和隔离策略

### 完成标志
测试用例完成后，输出"需求-用例可追溯矩阵"和"模块依赖测试矩阵"，然后可使用 `/tdd:implement` 开始TDD开发。

---
**特性状态**: $(echo "$ARGUMENTS" | cut -d" " -f2) | 模块: $(echo "$ARGUMENTS" | cut -d" " -f1) | 阶段: cases | 允许编辑: tests/specs/$(echo "$ARGUMENTS" | cut -d" " -f1)/**