---
description: 进入TDD GREEN阶段，最小实现使测试通过
allowed-tools: tdd_switch_phase, tdd_run_test, Bash(/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd:*)
---

切换到TDD GREEN阶段，编写最小实现代码。

## 🟢 TDD GREEN 阶段

### 当前模式
- **阶段**: TDD GREEN (最小实现)
- **允许修改**: src/**, yichao-** (生产代码)
- **禁止修改**: tests/** (测试代码，除非修复测试bug)

### 任务指令

> 请 **tdd-architect** 子代理执行以下任务：

#### 目标
编写**最小代码实现**，使RED阶段的测试通过，不添加任何未经测试覆盖的功能。

#### 输出位置
- `yichao-module-*/src/main/java/**` - 业务实现代码
- `yichao-framework/*/src/main/java/**` - 框架扩展代码

#### 核心原则
1. **最小实现** - 仅实现让测试通过的代码
2. **不过度设计** - 避免预测未来需求
3. **保持简单** - 选择最直接的实现方式
4. **测试驱动** - 每一行代码都应有测试覆盖

#### Spring Boot实现规范
```java
// Service层实现
@Service
@Transactional
public class CustomerCategoryServiceImpl implements CustomerCategoryService {
    
    @Autowired 
    private CustomerCategoryMapper customerCategoryMapper;
    
    @Override
    public Long createCategory(CustomerCategoryCreateReqVO createReq) {
        // 最小实现：仅满足测试需求
        CustomerCategoryDO categoryDO = CustomerCategoryConvert.INSTANCE
            .convert(createReq);
        categoryDO.setTenantId(TenantContextHolder.getTenantId());
        customerCategoryMapper.insert(categoryDO);
        return categoryDO.getId();
    }
}
```

```java
// Controller层实现
@RestController
@RequestMapping("/admin-api/customer/category")
@Tag(name = "客户类别管理")
public class CustomerCategoryController {
    
    @Autowired
    private CustomerCategoryService customerCategoryService;
    
    @PostMapping("/create")
    @Operation(summary = "创建客户类别")
    public CommonResult<Long> createCategory(
        @RequestBody @Valid CustomerCategoryCreateReqVO createReq) {
        Long categoryId = customerCategoryService.createCategory(createReq);
        return success(categoryId);
    }
}
```

#### TDD状态管理
- 自动切换到GREEN阶段
- 限制只能编辑生产代码文件
- 记录阶段变更和测试结果

#### 验证步骤
1. 实现最小代码
2. 运行测试验证通过：`/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test`
3. 确认所有RED阶段测试都通过
4. 不添加未经测试的额外功能
5. 记录GREEN阶段完成状态

#### 完成标志
- 所有RED阶段测试都通过
- 代码实现最小且简洁
- 没有添加未经测试的功能
- TDD状态和测试指标已更新
- 准备进入REFACTOR阶段：`/tdd:refactor`

---
**TDD状态**: GREEN | 专注: 最小实现 | 下一步: `/tdd:refactor`