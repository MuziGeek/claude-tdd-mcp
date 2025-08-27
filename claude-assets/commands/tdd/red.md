---
description: 进入TDD RED阶段，编写失败的测试
allowed-tools: Bash(printf:*), Bash(node:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd:*), mcp__task-master-ai__*
---

!`bash -c 'TASK_ID="${1:-}"; node .claude/scripts/tdd-task-integration.js red "$TASK_ID"'`

## 🔴 TDD RED 阶段

### 当前模式
- **阶段**: TDD RED (测试先行)
- **允许修改**: tests/** (仅测试文件)
- **禁止修改**: src/**, yichao-** (生产代码)

### 任务指令

> 请 **tdd-architect** 子代理执行以下任务：

#### 目标  
基于Task Master任务描述和已有的需求分析/技术设计文档，编写**会失败**的自动化测试代码。

#### 输入来源
- Task Master任务详情和描述
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

#### Task Master集成
- 自动更新任务状态为 `in-progress`
- 记录测试文件到任务元数据
- 跟踪测试指标

#### 验证步骤
1. 生成测试代码
2. 运行测试确保失败：`/mnt/d/CodeSoft/apache-maven-3.9.11/bin/mvn.cmd test`
3. 确认失败原因是"方法/类不存在"或"返回null/默认值"
4. 更新Task Master任务进度

#### 完成标志
- 所有测试用例都有对应的自动化测试
- 测试运行失败，失败原因明确
- 任务状态已同步到Task Master
- 准备进入GREEN阶段：`/tm:green <task-id>`

---
**TDD状态**: RED | 专注: 编写失败的测试 | 下一步: `/tm:green <task-id>`