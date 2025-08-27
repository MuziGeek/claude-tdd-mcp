# TDD 模块化开发命令指南

## 功能开发流程命令 (Feature Commands)

### 完整TDD开发流程

```bash
# 1. 初始化模块功能
/feature:init-module customer USER_PROFILE

# 2. PRD产品需求阶段
/feature:pm-module customer USER_PROFILE

# 3. 需求分析与技术设计阶段  
/feature:analyze-module customer USER_PROFILE

# 4. 测试用例设计阶段
/feature:cases-module customer USER_PROFILE

# 5. TDD实现阶段
/tdd:implement           # 进入TDD实现模式
/tdd:red                # RED: 编写失败测试
/tdd:green              # GREEN: 实现通过测试的代码
/tdd:refactor           # REFACTOR: 重构代码

# 6. 完成功能开发
/feature:done-module customer USER_PROFILE
```

## 可用模块

当前项目支持的模块（参考`.claude/config/modules.json`）：

- **customer** - 客户管理模块
- **tenant** - 租户管理模块  
- **goods** - 商品管理模块
- **sales** - 销售管理模块
- **smarthome** - 智能家居模块
- **members** - 会员管理模块
- **project** - 项目管理模块
- **workorder** - 工单管理模块

## TDD循环命令 (TDD Commands)

### TDD实现阶段命令

```bash
/tdd:implement    # 进入TDD实现模式
/tdd:red         # 切换到RED阶段：编写失败测试
/tdd:green       # 切换到GREEN阶段：实现通过代码
/tdd:refactor    # 切换到REFACTOR阶段：重构优化
```

## 提交命令 (Commit Commands)

```bash
/commit          # 智能提交当前更改
```

## 目录结构

模块化开发将按以下结构组织文档：

```
docs/
├── prd/
│   ├── customer/
│   │   ├── USER_PROFILE.prd.md
│   │   └── CUSTOMER_MGMT.prd.md
│   └── tenant/
│       └── MULTI_TENANT.prd.md
├── analysis/
│   ├── customer/
│   │   └── USER_PROFILE.requirements.md
│   └── tenant/
│       └── MULTI_TENANT.requirements.md
├── design/
│   ├── customer/
│   │   └── USER_PROFILE.design.md
│   └── tenant/
│       └── MULTI_TENANT.design.md
└── tests/
    └── specs/
        ├── customer/
        │   └── USER_PROFILE.test.md
        └── tenant/
            └── MULTI_TENANT.test.md
```

## 状态管理

TDD架构使用`.claude/cache/feature_state.json`管理当前特性状态：

```json
{
  "featureId": "USER_PROFILE",
  "module": "customer", 
  "stage": "pm|analysis|cases|impl_red|impl_green|refactor|complete",
  "tdd": "red|green|refactor",
  "paths": {
    "prd": "docs/prd/customer/USER_PROFILE.prd.md",
    "analysis": "docs/analysis/customer/USER_PROFILE.requirements.md",
    "design": "docs/design/customer/USER_PROFILE.design.md", 
    "tests": "tests/specs/customer/USER_PROFILE.test.md"
  }
}
```

## 质量门控

TDD Guard会根据当前阶段限制文件访问：

- **pm阶段**: 只能编辑PRD文档
- **analysis阶段**: 可编辑需求分析和技术设计文档
- **cases阶段**: 可编辑测试规格文档
- **impl_red阶段**: 只能编辑测试文件
- **impl_green阶段**: 可编辑实现代码
- **refactor阶段**: 可编辑代码但不能修改测试
- **complete阶段**: 只能修改系统配置文件

## 最佳实践

1. **严格遵循流程**: 按阶段顺序进行，不要跳跃
2. **模块边界清晰**: 明确定义模块间的接口和依赖
3. **测试驱动**: 先写测试后写实现
4. **小步快跑**: 频繁提交，保持代码可工作状态
5. **文档同步**: 保持文档与实现的一致性

## 故障排除

如果TDD Guard阻止了你的操作：
- 检查当前阶段：`cat .claude/cache/feature_state.json`
- 使用正确的阶段命令切换状态
- 确保文件路径符合模块化规范
- 如有问题，重新初始化：`/feature:init-module <module> <feature>`