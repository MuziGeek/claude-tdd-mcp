# Claude TDD脚手架用户操作指南

## 目录
1. [概述](#概述)
2. [环境准备](#环境准备)
3. [通过npm安装和配置](#通过npm安装和配置)
4. [Claude Code中的TDD开发流程](#claude-code中的tdd开发流程)
5. [完整的功能开发示例](#完整的功能开发示例)
6. [高级功能](#高级功能)
7. [故障排除](#故障排除)

## 概述

Claude TDD脚手架是专为Claude Code环境设计的测试驱动开发(TDD)工具。通过npm发布后，用户可以通过npx一键配置MCP服务，在Claude Code中使用完整的TDD工作流。

**主要特性**：
- ✅ 一键安装和配置
- ✅ 强制执行TDD红-绿-重构循环
- ✅ MCP服务自动化集成
- ✅ 跨对话状态持久化
- ✅ 多项目类型支持

## 环境准备

### 必需环境
- **Claude Desktop** (最新版本)
- **Node.js** >= 16.0.0
- **Git**
- 对应开发环境：
  - Java: JDK 11+, Maven/Gradle
  - Node.js: npm/pnpm/yarn
  - Python: Python 3.8+, pip

### 验证环境
```bash
# 检查Node.js版本
node --version  # 应该 >= 16.0.0

# 检查Claude Desktop
# 确保Claude Desktop已安装并可以正常启动

# 检查开发环境(以Java为例)
java --version
mvn --version
```

## 通过npm安装和配置

### 方法1：一键快速配置（推荐）

**步骤1**：在项目目录中执行
```bash
cd /path/to/your-project
npx @claude-tdd/scaffold quick-start
```

**自动化流程**：
1. 检测项目类型（Java/Node.js/Python等）
2. 初始化TDD目录结构
3. 配置Claude Desktop的MCP服务
4. 创建必要的配置文件

**步骤2**：重启Claude Desktop
```bash
# 完全关闭Claude Desktop
# 重新启动Claude Desktop
# MCP服务将自动加载
```

**完成提示**：
```
✅ Claude TDD脚手架配置完成！

🎯 下一步操作：
1. 重启Claude Desktop ← 重要！
2. 打开claude.ai/code
3. 开始使用TDD命令

📁 已创建目录：
- .claude/        (配置和hooks)
- docs/           (文档目录)
- tests/          (测试目录)
- src/ 或其他    (源码目录)
```

### 方法2：分步配置

**步骤1**：项目初始化
```bash
cd /path/to/your-project
npx @claude-tdd/scaffold init --profile=java-spring
```

**步骤2**：配置MCP服务
```bash
npx @claude-tdd/scaffold setup-mcp
```

**步骤3**：重启Claude Desktop

### 方法3：全局安装

```bash
# 全局安装
npm install -g @claude-tdd/scaffold

# 之后可直接使用
claude-tdd quick-start
```

## Claude Code中的TDD开发流程

### 验证MCP服务

**打开Claude Code后**：
```
用户: "列出可用的TDD工具"

Claude回应:
📋 可用的Claude TDD脚手架MCP工具：

🛠 项目管理工具:
- tdd_initialize - 初始化TDD项目
- tdd_scan_project - 扫描项目结构
- tdd_deep_analyze - 深度分析项目
- tdd_validate_env - 验证环境配置

🔄 TDD工作流工具:
- tdd_switch_phase - 切换TDD阶段
- tdd_create_feature - 创建新特性
- tdd_complete_phase - 完成当前阶段
- tdd_validate_path - 验证文件路径

⚙️ 配置管理工具:
- tdd_export_config - 导出项目配置
- tdd_import_config - 导入项目配置
- tdd_manage_profiles - 管理配置模板

📊 分析工具:
- tdd_export_analysis - 导出分析结果
- tdd_import_analysis - 导入分析结果
- tdd_compare_analysis - 比较分析结果
- tdd_apply_analysis - 应用分析结果

🚀 MCP服务运行正常，可以开始TDD开发！
```

### 项目状态查看

```
用户: "查看当前项目的TDD状态"

Claude自动执行:
tdd_get_status({
  projectRoot: "/path/to/your-project"
})

返回示例:
📊 TDD项目状态：
- 项目类型: Java Spring Boot
- 当前阶段: 未开始
- 配置状态: ✅ 已完成
- MCP服务: ✅ 运行正常
- 环境验证: ✅ 通过

💡 建议：可以开始创建新功能了！
```

## 完整的功能开发示例

以下是一个完整的客户分类管理功能开发流程：

### 1. 创建新功能

**用户交互**：
```
用户: "我要开发一个客户分类管理功能，支持增删改查"

Claude自动执行:
tdd_create_feature({
  projectRoot: "/workspace/customer-system",
  featureId: "CUSTOMER_CATEGORY_MGMT",
  description: "客户分类管理功能，支持分类的增删改查操作"
})

✅ 功能创建成功！
🆔 特性ID: CUSTOMER_CATEGORY_MGMT
📊 当前状态: TDD准备阶段
📁 已创建文档模板:
- docs/prd/CUSTOMER_CATEGORY_MGMT.prd.md
- docs/analysis/CUSTOMER_CATEGORY_MGMT.requirements.json
- docs/design/CUSTOMER_CATEGORY_MGMT.design.md
```

### 2. PRD编写阶段

**用户交互**：
```
用户: "帮我编写客户分类功能的需求文档"

Claude切换阶段并编写PRD:
[文件: docs/prd/CUSTOMER_CATEGORY_MGMT.prd.md]
```

**生成的PRD内容示例**：
```markdown
# 客户分类管理功能 PRD

## 1. 背景与目标
### 业务背景
当前客户管理系统缺乏分类功能，无法对客户进行有效分组管理。

### 用户价值
- 提高客户管理效率
- 支持精准营销
- 便于客户数据分析

## 2. 功能范围
### 核心功能
1. ✅ 创建客户分类
2. ✅ 编辑分类信息
3. ✅ 删除分类（安全检查）
4. ✅ 查询分类列表

### 非功能范围
- ❌ 客户批量分类调整
- ❌ 分类权限管理

## 3. 验收标准
### AC1: 创建分类
- Given: 管理员登录系统
- When: 创建名称为"VIP客户"的分类
- Then: 分类创建成功并返回分类ID

### AC2: 删除分类检查
- Given: 存在已关联客户的分类
- When: 尝试删除该分类
- Then: 系统提示错误并阻止删除

## 4. API设计
```java
POST /api/customer-categories
GET /api/customer-categories
PUT /api/customer-categories/{id}
DELETE /api/customer-categories/{id}
```
```

### 3. 需求分析阶段

**用户交互**：
```
用户: "基于PRD进行技术分析和设计"

Claude执行分析:
tdd_switch_phase({
  projectRoot: "/workspace/customer-system",
  phase: "ANALYSIS",
  featureId: "CUSTOMER_CATEGORY_MGMT"
})

分析结果生成到:
- docs/analysis/CUSTOMER_CATEGORY_MGMT.requirements.json
- docs/design/CUSTOMER_CATEGORY_MGMT.design.md
```

### 4. TDD RED阶段 - 编写测试

**用户交互**：
```
用户: "开始TDD开发，先写测试"

Claude切换到RED阶段:
tdd_switch_phase({
  projectRoot: "/workspace/customer-system",
  phase: "RED",
  featureId: "CUSTOMER_CATEGORY_MGMT"
})

🔴 已进入TDD RED阶段
📝 当前任务: 编写会失败的测试代码
🚫 限制: 只能修改 tests/ 目录下的文件
✅ 允许: tests/unit/**, tests/integration/**
```

**Claude生成测试代码**：
```java
// tests/unit/CustomerCategoryServiceTest.java
@SpringBootTest
@Transactional
class CustomerCategoryServiceTest {

    @Autowired
    private CustomerCategoryService customerCategoryService;
    
    @Test
    @DisplayName("应该成功创建客户分类")
    void shouldCreateCustomerCategory() {
        // Given
        CustomerCategoryCreateReqVO createReq = CustomerCategoryCreateReqVO.builder()
            .name("VIP客户")
            .description("重要客户分类")
            .build();
        
        // When
        Long categoryId = customerCategoryService.createCategory(createReq);
        
        // Then
        assertThat(categoryId).isNotNull();
        assertThat(categoryId).isGreaterThan(0L);
    }
    
    @Test
    @DisplayName("应该查询所有客户分类")
    void shouldListAllCategories() {
        // Given - 系统中存在分类数据
        
        // When
        List<CustomerCategoryRespVO> categories = customerCategoryService.listCategories();
        
        // Then
        assertThat(categories).isNotNull();
        // 此测试会失败，因为Service还未实现
    }
}
```

**运行测试确认失败**：
```bash
mvn test
```

**输出**：
```
[ERROR] Tests run: 2, Failures: 0, Errors: 2
[ERROR] shouldCreateCustomerCategory: CustomerCategoryService不存在
[ERROR] shouldListAllCategories: CustomerCategoryService不存在

✅ 测试失败符合预期（RED阶段目标达成）
```

### 5. TDD GREEN阶段 - 最小实现

**用户交互**：
```
用户: "现在实现代码让测试通过"

Claude切换到GREEN阶段:
tdd_switch_phase({
  projectRoot: "/workspace/customer-system",
  phase: "GREEN", 
  featureId: "CUSTOMER_CATEGORY_MGMT"
})

🟢 已进入TDD GREEN阶段
📝 当前任务: 编写最小代码让测试通过
🚫 限制: 不能修改 tests/ 目录下的文件
✅ 允许: src/**, 生产代码目录
```

**Claude实现最小代码**：
```java
// src/main/java/service/CustomerCategoryService.java
@Service
public class CustomerCategoryService {
    
    public Long createCategory(CustomerCategoryCreateReqVO createReq) {
        // 最小实现 - 仅返回固定ID让测试通过
        return 1L;
    }
    
    public List<CustomerCategoryRespVO> listCategories() {
        // 最小实现 - 返回空列表让测试通过
        return new ArrayList<>();
    }
}

// src/main/java/vo/CustomerCategoryCreateReqVO.java
@Data
@Builder
public class CustomerCategoryCreateReqVO {
    private String name;
    private String description;
}

// src/main/java/vo/CustomerCategoryRespVO.java
@Data
public class CustomerCategoryRespVO {
    private Long id;
    private String name;
    private String description;
}
```

**再次运行测试**：
```bash
mvn test
```

**输出**：
```
[INFO] Tests run: 2, Failures: 0, Errors: 0

✅ 所有测试通过（GREEN阶段目标达成）
```

### 6. TDD REFACTOR阶段 - 重构优化

**用户交互**：
```
用户: "现在重构代码，实现真正的业务逻辑"

Claude切换到REFACTOR阶段:
tdd_switch_phase({
  projectRoot: "/workspace/customer-system",
  phase: "REFACTOR",
  featureId: "CUSTOMER_CATEGORY_MGMT"
})

🔵 已进入TDD REFACTOR阶段  
📝 当前任务: 重构代码提高质量，保持测试通过
✅ 允许: 修改生产代码，保持测试绿色
⚠️ 原则: 不改变外部行为，只优化内部实现
```

**Claude重构实现**：
```java
// 重构后的CustomerCategoryService.java
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerCategoryService {
    
    private final CustomerCategoryRepository repository;
    private final CustomerCategoryMapper mapper;
    
    @Transactional
    public Long createCategory(CustomerCategoryCreateReqVO createReq) {
        log.info("创建客户分类: {}", createReq.getName());
        
        // 参数验证
        validateCreateRequest(createReq);
        
        // 转换为实体
        CustomerCategoryEntity entity = mapper.toEntity(createReq);
        entity.setCreateTime(LocalDateTime.now());
        entity.setDeleted(Boolean.FALSE);
        
        // 保存并返回
        CustomerCategoryEntity saved = repository.save(entity);
        
        log.info("客户分类创建成功，ID: {}", saved.getId());
        return saved.getId();
    }
    
    @Transactional(readOnly = true)
    public List<CustomerCategoryRespVO> listCategories() {
        log.info("查询所有客户分类");
        
        List<CustomerCategoryEntity> entities = repository.findByDeletedFalse();
        return mapper.toVOList(entities);
    }
    
    private void validateCreateRequest(CustomerCategoryCreateReqVO request) {
        if (StringUtils.isBlank(request.getName())) {
            throw new IllegalArgumentException("分类名称不能为空");
        }
        
        // 检查名称重复
        if (repository.existsByNameAndDeletedFalse(request.getName())) {
            throw new BusinessException("分类名称已存在");
        }
    }
}
```

**最终测试验证**：
```bash
mvn test
```

**输出**：
```
[INFO] Tests run: 2, Failures: 0, Errors: 0
[INFO] 测试覆盖率: 85%

✅ 重构完成，所有测试保持通过
🎉 TDD循环成功完成：RED → GREEN → REFACTOR
```

### 7. 完成功能开发

**用户交互**：
```
用户: "功能开发完成，准备提交"

Claude完成阶段:
tdd_complete_phase({
  projectRoot: "/workspace/customer-system",
  result: "客户分类管理功能开发完成，所有测试通过"
})

🎉 功能开发完成！

📊 完成统计:
- TDD循环: 1轮完整循环
- 测试用例: 2个
- 测试覆盖率: 85%
- 代码文件: 5个

🏷 自动生成提交信息:
feat: 实现客户分类管理功能

主要完成内容：
1. 客户分类CRUD功能
   - 创建分类接口
   - 查询分类列表接口
   - 参数验证和异常处理
   - 数据持久化实现

2. TDD开发实践
   - 完整RED-GREEN-REFACTOR循环
   - 单元测试覆盖核心业务逻辑
   - 代码结构清晰可维护

技术亮点：
- 使用MapStruct进行VO/Entity转换
- 实现了软删除机制
- 添加了业务异常处理

测试覆盖率：85%
性能影响：无显著影响

🤖 Generated with Claude Code (claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## 高级功能

### 项目深度分析

```
用户: "分析项目架构和测试策略"

Claude执行:
tdd_deep_analyze({
  projectRoot: "/workspace/customer-system"
})

📊 项目深度分析结果:

🏗 架构分析:
- 模式: 分层架构 (Controller-Service-Repository)
- 评分: 8/10
- 建议: 考虑引入Domain层进行复杂业务逻辑封装

🧪 测试策略分析:
- 单元测试覆盖率: 78%
- 集成测试: 缺失API层测试
- 建议: 添加Controller层集成测试

⚙️ 技术栈分析:
- Spring Boot: 2.7.0 (建议升级到3.x)
- MyBatis Plus: 3.5.2 (版本较新)
- 依赖风险: 低

🔧 代码模式分析:
- 发现重复代码: 3处
- 复杂度: 中等
- 建议: 提取通用的CRUD基类
```

### 配置导入导出

```
用户: "导出当前项目配置用于其他项目"

Claude执行:
tdd_export_config({
  projectRoot: "/workspace/customer-system",
  outputPath: "customer-system-tdd-config.json"
})

✅ 配置导出成功!
📁 导出文件: customer-system-tdd-config.json
📋 包含内容:
- 项目配置文件
- TDD阶段设置
- 代码生成模板
- hooks配置
- 测试策略设置

💡 使用方法:
在新项目中导入: 
tdd_import_config({
  projectRoot: "/path/to/new-project",
  configPath: "customer-system-tdd-config.json"
})
```

### 跨对话状态恢复

```
用户: (新对话开始) "继续昨天的客户管理功能开发"

Claude自动恢复状态:
tdd_get_status({
  projectRoot: "/workspace/customer-system"
})

📋 恢复会话状态:
- 项目: 客户管理系统
- 当前功能: CUSTOMER_CATEGORY_MGMT
- TDD阶段: REFACTOR (已完成)
- 开发进度: 85%
- 最后更新: 2024-01-01 18:30

💡 下一步建议:
1. 添加更多测试用例
2. 实现更新和删除功能
3. 添加API层集成测试

要继续开发吗？
```

## 故障排除

### 常见问题解决

#### 1. MCP服务未加载

**症状**：Claude Code中看不到TDD工具

**解决方案**：
```bash
# 1. 检查Claude配置文件
# Windows: %APPDATA%/Claude/claude_desktop_config.json
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
# Linux: ~/.config/Claude/claude_desktop_config.json

# 2. 验证配置格式
{
  "mcpServers": {
    "tdd-scaffold": {
      "command": "node",
      "args": ["正确的路径/mcp-server/index.js"],
      "env": {
        "TDD_CACHE_DIR": "缓存目录路径"
      }
    }
  }
}

# 3. 重新安装
npx @claude-tdd/scaffold setup-mcp

# 4. 完全重启Claude Desktop
```

#### 2. TDD阶段切换失败

**症状**：提示"阶段切换被阻止"

**解决方案**：
```
用户: "TDD阶段切换失败怎么办？"

Claude执行诊断:
tdd_validate_env({
  projectRoot: "/workspace/customer-system"
})

🔍 诊断结果:
- 当前阶段: RED
- 错误原因: 存在未提交的生产代码修改
- 建议操作: 提交或撤销修改后重试

🛠 修复步骤:
1. git status (检查修改)
2. git add . && git commit -m "暂存修改"
3. 重新切换阶段

🚨 紧急情况可以强制切换:
tdd_switch_phase({
  phase: "GREEN", 
  force: true
})  // 慎用！
```

#### 3. 项目类型检测错误

**症状**：初始化时选择了错误的项目类型

**解决方案**：
```bash
# 重新初始化并指定正确类型
npx @claude-tdd/scaffold init --profile=java-spring --force

# 或者手动指定
tdd_initialize({
  projectRoot: "/path/to/project",
  profile: "node-express",  // 指定正确类型
  force: true
})
```

#### 4. 测试运行失败

**症状**：TDD测试无法正常运行

**解决方案**：
```bash
# 检查构建工具
mvn --version    # Java项目
npm --version    # Node.js项目
python --version # Python项目

# 安装依赖
mvn clean install  # Java
npm install        # Node.js  
pip install -r requirements.txt  # Python

# 重新验证环境
npx @claude-tdd/scaffold init --validate-only
```

### 获得帮助

- 📖 **文档**: [项目README](../../README.md)
- 🐛 **问题报告**: [GitHub Issues](https://github.com/yourusername/claude-tdd-scaffold/issues)
- 💬 **社区讨论**: [GitHub Discussions](https://github.com/yourusername/claude-tdd-scaffold/discussions)
- 📧 **邮件支持**: support@example.com

### 最佳实践

1. **定期保存状态**: 每完成一个TDD循环后提交代码
2. **保持测试绿色**: 确保测试始终通过再进行下一步
3. **小步前进**: 每次只实现一个小功能
4. **利用状态恢复**: 充分利用跨对话状态持久化功能
5. **遵循命名约定**: 使用清晰的功能ID和描述

---

🎉 **恭喜！** 您已完成Claude TDD脚手架的完整学习。现在可以开始高效的TDD开发之旅了！

🚀 **下一步**: 查看[快速开始指南](QUICK-START.md)或[TDD工作流详解](TDD-WORKFLOW.md)