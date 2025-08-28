---
description: 进入TDD REFACTOR阶段，重构和优化代码
allowed-tools: tdd_switch_phase, tdd_run_test, Bash(/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd:*)
---

切换到TDD REFACTOR阶段，开始重构和优化代码。

## 🔄 TDD REFACTOR 阶段

### 当前模式
- **阶段**: TDD REFACTOR (重构优化)
- **允许修改**: src/**, yichao-**, docs/** (生产代码和文档)
- **限制条件**: 保持所有测试通过

### 任务指令

> 请 **tdd-architect** 子代理执行以下任务：

#### 目标
在保持所有测试通过的前提下，重构和优化GREEN阶段的实现代码，提升代码质量。

#### 重构范围
- `yichao-module-*/src/main/java/**` - 业务实现代码
- `yichao-framework/*/src/main/java/**` - 框架扩展代码
- `docs/design/<TASK_ID>.design.md` - 更新设计文档

#### 重构原则
1. **测试保护** - 每次重构后必须运行测试确保通过
2. **小步快跑** - 进行小的、渐进式的重构
3. **提升质量** - 改善可读性、可维护性和性能
4. **遵循规范** - 符合项目代码规范和最佳实践

#### 重构检查清单
- [ ] **命名优化** - 类名、方法名、变量名清晰表达意图
- [ ] **方法提取** - 将长方法分解为小的、职责单一的方法
- [ ] **重复消除** - 提取公共代码到工具类或基类
- [ ] **异常处理** - 完善异常处理和错误信息
- [ ] **性能优化** - 优化数据库查询、缓存使用等
- [ ] **文档更新** - 更新注释和API文档

#### 重构示例
```java
// 重构前：GREEN阶段的最小实现
@Override
public Long createCategory(CustomerCategoryCreateReqVO createReq) {
    CustomerCategoryDO categoryDO = CustomerCategoryConvert.INSTANCE
        .convert(createReq);
    categoryDO.setTenantId(TenantContextHolder.getTenantId());
    customerCategoryMapper.insert(categoryDO);
    return categoryDO.getId();
}

// 重构后：添加验证、异常处理、日志
@Override
public Long createCategory(CustomerCategoryCreateReqVO createReq) {
    // 1. 参数验证
    validateCreateRequest(createReq);
    
    // 2. 业务规则检查
    checkCategoryNameUniqueness(createReq.getName());
    
    // 3. 数据转换和保存
    CustomerCategoryDO categoryDO = convertToEntity(createReq);
    categoryDO.setTenantId(TenantContextHolder.getTenantId());
    
    try {
        customerCategoryMapper.insert(categoryDO);
        log.info("客户类别创建成功: {}", categoryDO.getName());
        return categoryDO.getId();
    } catch (DuplicateKeyException e) {
        throw new BusinessException("客户类别名称已存在");
    }
}

private void validateCreateRequest(CustomerCategoryCreateReqVO createReq) {
    if (StrUtil.isBlank(createReq.getName())) {
        throw new BusinessException("客户类别名称不能为空");
    }
}

private void checkCategoryNameUniqueness(String name) {
    CustomerCategoryDO existing = customerCategoryMapper.selectByName(name);
    if (existing != null) {
        throw new BusinessException("客户类别名称已存在");
    }
}

private CustomerCategoryDO convertToEntity(CustomerCategoryCreateReqVO createReq) {
    return CustomerCategoryConvert.INSTANCE.convert(createReq);
}
```

#### TDD状态管理
- 自动切换到REFACTOR阶段
- 允许编辑所有生产代码和文档
- 记录重构过程和测试结果

#### 验证步骤
1. 进行渐进式重构
2. 每次改动后运行测试：`/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test`
3. 确保所有测试持续通过
4. 运行代码质量检查
5. 更新设计文档和注释
6. 完成后记录REFACTOR阶段状态

#### 完成标志
- 代码质量显著提升
- 所有测试依然通过
- 代码符合项目规范
- 文档已更新
- TDD状态更新为REFACTOR完成

#### 最终步骤
完成REFACTOR阶段后，可以：
- 开始下一个功能的TDD循环
- 或者继续为当前功能添加更多测试

---
**TDD状态**: REFACTOR | 专注: 质量优化 | 下一步: 完成当前循环