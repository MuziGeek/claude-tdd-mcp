---
description: 进入TDD RED阶段，编写失败的测试
allowed-tools: tdd_switch_phase, tdd_run_test, Bash(/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd:*)
---

切换到TDD RED阶段，开始编写失败测试。

## 🔴 TDD RED 阶段

### 当前模式
- **阶段**: TDD RED (测试先行)
- **允许修改**: tests/** (仅测试文件)
- **禁止修改**: src/**, yichao-** (生产代码)

### 任务指令

> 请 **tdd-architect** 子代理执行以下任务：

#### 目标  
基于当前功能需求和已有的设计文档，编写**会失败**的自动化测试代码。

#### 输入来源
- 功能需求和用户故事
- 已存在的设计文档 (如果有)
- 项目现有代码结构和模式

#### 输出位置
- `tests/unit/**/*.java` - JUnit 5单元测试
- `tests/integration/**/*.java` - Spring Boot集成测试

#### 核心原则
1. **仅生成测试代码** - 不实现任何业务逻辑
2. **确保失败原因明确** - 聚焦在"未实现/未满足断言"
3. **断言清晰** - 明确表达期望行为  
4. **遵循AAA模式** - Given-When-Then结构

#### Java测试规范
```java
@SpringBootTest
@Transactional
class CustomerCategoryServiceTest {

    @Autowired
    private CustomerCategoryService customerCategoryService;
    
    @Test
    @DisplayName("应该_创建客户类别_当_提供有效信息时")
    void should_createCustomerCategory_when_validInfoProvided() {
        // Given - 准备测试数据
        CustomerCategoryCreateReqVO createReq = CustomerCategoryCreateReqVO.builder()
            .name("VIP客户")
            .description("VIP级别客户")
            .build();
        
        // When - 执行被测试的操作
        Long categoryId = customerCategoryService.createCategory(createReq);
        
        // Then - 验证结果
        assertThat(categoryId).isNotNull();
        // 此测试应该失败，因为 CustomerCategoryService 还未实现
    }
}
```

#### TDD状态管理
- 自动切换到RED阶段
- 限制只能编辑测试文件
- 记录阶段变更历史

#### 验证步骤
1. 生成测试代码
2. 运行测试确保失败：`/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test`
3. 确认失败原因是"方法/类不存在"或"返回null/默认值"
4. 记录RED阶段完成状态

#### 完成标志
- 所有测试用例都有对应的自动化测试
- 测试运行失败，失败原因明确
- TDD状态记录RED阶段完成
- 准备进入GREEN阶段：`/tdd:green`

---
**TDD状态**: RED | 专注: 编写失败的测试 | 下一步: `/tdd:green`