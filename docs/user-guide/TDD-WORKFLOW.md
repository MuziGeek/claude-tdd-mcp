# TDD工作流 - 用户操作指南

## 🎯 用户视角的TDD体验

这份指南将详细展示您在Claude Code中使用TDD脚手架的完整交互流程，每一步都包含具体的用户操作、Claude的响应和预期结果。

---

## 📋 开始之前：确认环境就绪

### 1. 验证MCP连接状态

**您的操作**：在Claude Code中输入
```
"列出可用的TDD工具"
```

**Claude的响应**：
```
✅ 检测到Claude TDD MCP工具：

🤖 智能命令工具：
- tdd_smart_command - 自然语言执行TDD操作
- tdd_list_aliases - 显示命令别名
- tdd_smart_help - 智能命令帮助

📊 项目管理工具：
- tdd_auto_init_project - 零配置初始化
- tdd_get_status - 获取项目状态
- tdd_deep_analyze - 深度项目分析
... (显示完整工具列表)
```

**预期结果**：如果看到工具列表，说明MCP连接正常。如果看不到，请重启Claude Desktop。

---

## 🚀 第一步：初始化TDD项目

### 用户操作选项

**方式1：智能命令（推荐）**
```
"初始化我的项目为TDD模式"
```

**方式2：直接工具调用**
```javascript
tdd_auto_init_project({ projectRoot: "/path/to/your-project" })
```

### Claude的完整响应流程

**1. 项目检测阶段**
```
🔍 正在检测项目类型...

检测结果：
- 项目类型：Java Spring Boot
- 构建工具：Maven  
- 测试框架：JUnit 5
- 数据库：MySQL
- 推荐Profile：java-spring
```

**2. 自动配置阶段**
```
⚙️ 正在配置TDD环境...

已创建目录结构：
✅ .tdd/config/
✅ .tdd/cache/
✅ .tdd/logs/

已生成配置文件：
✅ tdd-config.json - TDD工作流配置
✅ test-patterns.json - 测试路径规则
✅ phase-rules.json - 阶段约束规则
```

**3. 完成确认**
```
🎉 TDD项目初始化完成！

当前状态：
- TDD阶段：READY
- 支持的操作：创建功能、开始TDD循环
- 下一步建议：创建第一个功能

提示：说 "创建新功能" 或 "我要开发登录功能" 来开始
```

**您的预期体验**：整个过程2-3分钟内完成，无需手动配置

---

## 🎯 第二步：创建您的第一个功能

### 用户操作示例

**场景：开发用户登录功能**

**您的输入**：
```
"我要开发用户登录功能"
```

### Claude的智能处理流程

**1. 功能解析和确认**
```
🎯 理解您的需求：用户登录功能

自动分析：
- 功能模块：用户认证 (USER_AUTH)
- 核心功能：登录验证、会话管理、权限检查
- 预估复杂度：中等

是否需要详细的PRD分析？ (推荐：是)
```

**2. 创建功能骨架**
```javascript
// Claude自动调用
tdd_create_feature({
  projectRoot: "/your-project",
  featureId: "USER_LOGIN",
  description: "用户登录功能：支持用户名/密码认证和会话管理"
})
```

**3. 功能创建完成反馈**
```
✅ 功能 USER_LOGIN 创建成功！

已生成文件：
📄 docs/prd/USER_LOGIN.prd.md - 产品需求文档  
📄 docs/analysis/USER_LOGIN.requirements.json - 需求分析
📋 tests/specs/USER_LOGIN.cases.yaml - 测试用例规格

🔄 已切换到TDD模式
- 当前功能：USER_LOGIN
- 当前阶段：READY
- 下一步：进入RED阶段编写测试

准备开始TDD循环了吗？说 "开始RED阶段" 即可
```

---

## 🔴 第三步：RED阶段 - 编写失败测试

### 用户操作

**您的输入**：
```
"开始RED阶段，写用户登录的测试"
```

### Claude的详细响应

**1. 阶段切换确认**
```javascript
// Claude自动执行
tdd_switch_phase({
  projectRoot: "/your-project",
  phase: "RED",
  featureId: "USER_LOGIN"
})
```

```
🔴 进入RED阶段

当前限制：
✅ 可以编辑：tests/**, spec/**, *Test.java, *Spec.js
❌ 禁止编辑：src/main/**, 生产代码目录

目标：编写描述用户登录行为的测试代码，确保测试失败
```

**2. 测试代码生成**
```
📝 正在生成用户登录测试...

创建文件：src/test/java/com/yourapp/auth/UserLoginServiceTest.java
```

```java
@SpringBootTest
@DisplayName("用户登录服务测试")
class UserLoginServiceTest {
    
    @Autowired
    private UserLoginService userLoginService; // 这个类还不存在，测试会失败
    
    @Test
    @DisplayName("应该成功登录有效用户")
    void shouldLoginValidUser() {
        // Given - 准备测试数据
        LoginRequest request = LoginRequest.builder()
            .username("testuser")
            .password("password123")
            .build();
        
        // 预设用户存在
        when(userRepository.findByUsername("testuser"))
            .thenReturn(createValidUser());
        
        // When - 执行登录
        LoginResult result = userLoginService.login(request);
        
        // Then - 验证结果
        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getToken()).isNotBlank();
        assertThat(result.getUserInfo().getUsername()).isEqualTo("testuser");
    }
    
    @Test
    @DisplayName("应该拒绝无效密码")
    void shouldRejectInvalidPassword() {
        // Given
        LoginRequest request = LoginRequest.builder()
            .username("testuser")
            .password("wrongpassword")
            .build();
        
        when(userRepository.findByUsername("testuser"))
            .thenReturn(createValidUser());
        
        // When
        LoginResult result = userLoginService.login(request);
        
        // Then
        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isEqualTo("INVALID_CREDENTIALS");
    }
}
```

**3. 自动运行测试验证失败**
```
🧪 运行测试验证是否失败...

测试执行结果：
❌ UserLoginServiceTest.shouldLoginValidUser
   错误：找不到 UserLoginService 类
   
❌ UserLoginServiceTest.shouldRejectInvalidPassword  
   错误：找不到 LoginRequest 类

✅ RED阶段验证通过！测试正确失败了

📋 需要实现的类：
- UserLoginService
- LoginRequest  
- LoginResult

准备进入GREEN阶段了吗？说 "进入GREEN阶段" 开始实现代码
```

### 用户预期体验
- 看到详细的测试代码自动生成
- 确认测试因为类不存在而失败（这是正确的）
- 理解下一步需要实现哪些类

---

## 🟢 第四步：GREEN阶段 - 最小实现

### 用户操作

**您的输入**：
```
"进入GREEN阶段，实现让测试通过的代码"
```

### Claude的详细响应

**1. 阶段切换**
```javascript
// Claude自动执行
tdd_switch_phase({
  projectRoot: "/your-project", 
  phase: "GREEN",
  featureId: "USER_LOGIN"
})
```

```
🟢 进入GREEN阶段

当前限制：
❌ 禁止编辑：tests/**, spec/**, *Test.java  
✅ 可以编辑：src/main/**, 生产代码目录

目标：编写最少的代码让测试通过，避免过度设计
```

**2. 逐步实现代码**

**第一步：创建数据传输对象**
```java
// 创建：src/main/java/com/yourapp/auth/dto/LoginRequest.java
@Data
@Builder
public class LoginRequest {
    private String username;
    private String password;
}

// 创建：src/main/java/com/yourapp/auth/dto/LoginResult.java  
@Data
@Builder
public class LoginResult {
    private boolean success;
    private String token;
    private UserInfo userInfo;
    private String errorCode;
}
```

**第二步：创建服务类最小实现**
```java
// 创建：src/main/java/com/yourapp/auth/UserLoginService.java
@Service
@RequiredArgsConstructor
public class UserLoginService {
    
    private final UserRepository userRepository;
    
    public LoginResult login(LoginRequest request) {
        // 最简单的实现让测试通过
        User user = userRepository.findByUsername(request.getUsername());
        
        if (user != null && "password123".equals(request.getPassword())) {
            // 硬编码让第一个测试通过
            return LoginResult.builder()
                .success(true)
                .token("fake-token-12345")
                .userInfo(UserInfo.from(user))
                .build();
        }
        
        return LoginResult.builder()
            .success(false)
            .errorCode("INVALID_CREDENTIALS")
            .build();
    }
}
```

**3. 运行测试验证通过**
```
🧪 运行测试验证实现...

测试执行结果：
✅ UserLoginServiceTest.shouldLoginValidUser - 通过
✅ UserLoginServiceTest.shouldRejectInvalidPassword - 通过

🎉 GREEN阶段完成！所有测试通过

📊 当前状态：
- 测试数量：2个
- 通过率：100%
- 代码覆盖率：85%

注意：当前实现比较粗糙（硬编码密码、简单token）
准备优化代码了吗？说 "进入REFACTOR阶段" 开始重构
```

### 用户预期体验
- 看到逐步的代码实现过程
- 理解每一步的实现目标
- 确认测试从红色变为绿色

---

## 🔧 第五步：REFACTOR阶段 - 质量优化

### 用户操作

**您的输入**：
```
"进入REFACTOR阶段，优化代码质量"
```

### Claude的详细响应

**1. 阶段切换**
```javascript
// Claude自动执行  
tdd_switch_phase({
  projectRoot: "/your-project",
  phase: "REFACTOR",
  featureId: "USER_LOGIN"  
})
```

```
🔧 进入REFACTOR阶段

当前权限：
✅ 可以编辑：所有文件（生产代码 + 测试代码）
⚠️ 约束：必须保持所有测试通过

目标：改善代码设计，消除技术债务，添加错误处理
```

**2. 识别重构机会**
```
🔍 代码质量分析：

发现的问题：
❌ 硬编码密码验证
❌ 简单token生成  
❌ 缺少密码加密
❌ 没有用户状态检查
❌ 缺少日志记录
❌ 异常处理不完整

📋 重构计划：
1. 添加密码加密服务
2. 实现JWT token生成
3. 添加用户状态验证
4. 完善错误处理
5. 添加操作日志
```

**3. 执行重构**

**添加密码加密**
```java
@Service
@RequiredArgsConstructor  
@Slf4j
public class UserLoginService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenGenerator tokenGenerator;
    private final LoginAttemptService loginAttemptService;
    
    public LoginResult login(LoginRequest request) {
        log.info("用户登录尝试: {}", request.getUsername());
        
        try {
            // 1. 检查登录尝试次数
            if (loginAttemptService.isBlocked(request.getUsername())) {
                log.warn("用户账户被锁定: {}", request.getUsername());
                return buildFailureResult("ACCOUNT_LOCKED");
            }
            
            // 2. 查找用户
            User user = userRepository.findByUsername(request.getUsername());
            if (user == null) {
                log.warn("用户不存在: {}", request.getUsername());
                loginAttemptService.recordFailedAttempt(request.getUsername());
                return buildFailureResult("INVALID_CREDENTIALS");
            }
            
            // 3. 验证用户状态
            if (!user.isActive()) {
                log.warn("用户账户未激活: {}", request.getUsername());
                return buildFailureResult("ACCOUNT_INACTIVE");
            }
            
            // 4. 验证密码
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                log.warn("密码错误: {}", request.getUsername());
                loginAttemptService.recordFailedAttempt(request.getUsername());
                return buildFailureResult("INVALID_CREDENTIALS");
            }
            
            // 5. 生成JWT token
            String token = tokenGenerator.generateToken(user);
            
            // 6. 记录成功登录
            loginAttemptService.recordSuccessfulLogin(request.getUsername());
            log.info("用户登录成功: userId={}", user.getId());
            
            return LoginResult.builder()
                .success(true)
                .token(token)
                .userInfo(UserInfo.from(user))
                .build();
                
        } catch (Exception e) {
            log.error("登录处理异常: username={}", request.getUsername(), e);
            return buildFailureResult("SYSTEM_ERROR");
        }
    }
    
    private LoginResult buildFailureResult(String errorCode) {
        return LoginResult.builder()
            .success(false)
            .errorCode(errorCode)
            .build();
    }
}
```

**4. 增加边界测试**
```java
@Test
@DisplayName("应该锁定多次失败登录的账户")
void shouldLockAccountAfterMultipleFailures() {
    // Given - 模拟账户被锁定
    when(loginAttemptService.isBlocked("testuser")).thenReturn(true);
    
    LoginRequest request = LoginRequest.builder()
        .username("testuser")
        .password("anypassword")
        .build();
    
    // When
    LoginResult result = userLoginService.login(request);
    
    // Then
    assertThat(result.isSuccess()).isFalse();
    assertThat(result.getErrorCode()).isEqualTo("ACCOUNT_LOCKED");
    
    // 验证不会查询数据库
    verify(userRepository, never()).findByUsername(anyString());
}

@Test
@DisplayName("应该拒绝非激活用户登录")
void shouldRejectInactiveUserLogin() {
    // Given
    User inactiveUser = createTestUser();
    inactiveUser.setActive(false);
    when(userRepository.findByUsername("testuser")).thenReturn(inactiveUser);
    
    LoginRequest request = createValidLoginRequest();
    
    // When
    LoginResult result = userLoginService.login(request);
    
    // Then
    assertThat(result.isSuccess()).isFalse();
    assertThat(result.getErrorCode()).isEqualTo("ACCOUNT_INACTIVE");
}
```

**5. 验证重构结果**
```
🧪 运行完整测试套件...

测试执行结果：
✅ shouldLoginValidUser - 通过
✅ shouldRejectInvalidPassword - 通过  
✅ shouldLockAccountAfterMultipleFailures - 通过 (新增)
✅ shouldRejectInactiveUserLogin - 通过 (新增)

📊 重构成果：
- 测试数量：4个 (+2)
- 通过率：100%
- 代码覆盖率：92% (+7%)
- 圈复杂度：降低15%

🎉 REFACTOR阶段完成！代码质量显著提升

✨ 改进总结：
- 添加了密码加密验证
- 实现了JWT token生成  
- 增加了账户状态检查
- 完善了错误处理和日志
- 提高了测试覆盖率
```

### 用户预期体验
- 看到代码从简单实现演进到产品级质量
- 理解每项重构的价值和意义
- 确认所有测试保持绿色状态

---

## 🔄 第六步：TDD循环完成和提交

### 用户操作

**您的输入**：
```
"这个功能完成了，帮我生成提交信息"
```

### Claude的详细响应

**1. 完成当前TDD循环**
```javascript
// Claude自动执行
tdd_complete_phase({
  projectRoot: "/your-project",
  result: "用户登录功能开发完成，包含完整的认证流程和安全检查"
})
```

```
✅ 用户登录功能 TDD循环完成！

📊 完成统计：
- TDD循环轮次：1轮完整 RED→GREEN→REFACTOR
- 开发时长：45分钟
- 测试用例：4个单元测试
- 代码覆盖率：92%
- 实现类：5个 (Service, DTO, Utils)

🏆 质量指标：
- 所有测试通过 ✅
- 无代码异味 ✅  
- 符合团队编码规范 ✅
- 包含完整错误处理 ✅
```

**2. 生成详细提交信息**
```
📝 生成提交信息...

建议的提交信息：
```

```
feat: 实现用户登录功能

主要完成内容：
1. 用户认证服务 (UserLoginService)
   - 支持用户名/密码登录验证
   - 集成BCrypt密码加密验证
   - JWT token生成和用户会话管理
   - 登录失败次数限制和账户锁定保护

2. 数据传输对象
   - LoginRequest - 登录请求参数封装
   - LoginResult - 登录结果和token返回
   - UserInfo - 用户基本信息DTO

3. 安全增强功能  
   - 密码强度验证和加密存储
   - 登录尝试次数跟踪 (LoginAttemptService)
   - 用户账户状态验证 (激活/锁定)
   - 操作日志记录和异常处理

技术亮点：
- 严格遵循TDD开发流程 (RED→GREEN→REFACTOR)
- 使用Spring Security密码加密
- JWT token无状态认证设计
- 防暴力破解的账户锁定机制

测试覆盖率：92%
性能影响：登录验证平均响应时间 <200ms

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**3. 执行提交**
```
执行Git提交...

git add .
git commit -m "详细提交信息..."

✅ 提交成功！Commit ID: a1b2c3d

📋 下一步建议：
- 推送到远程仓库：git push origin feature/user-login  
- 创建Pull Request进行代码审查
- 开始下一个功能的TDD循环

说 "开始下一个功能" 继续开发，或 "查看项目状态" 了解整体进度
```

---

## 📊 进度跟踪和状态查询

### 随时查看项目状态

**您的输入**：
```
"查看当前TDD状态"
```

**Claude的响应**：
```javascript
// 自动调用
tdd_enhanced_status({ projectRoot: "/your-project" })
```

```
📊 TDD项目状态仪表盘

🎯 当前功能：USER_LOGIN
📍 当前阶段：COMPLETED  
⏱️ 阶段时长：45分钟

📈 项目统计：
- 已完成功能：1个
- 总测试用例：4个
- 测试通过率：100%
- 代码覆盖率：92%
- TDD循环次数：1次

🏗️ 项目架构：
- 服务层：UserLoginService ✅
- 数据层：UserRepository ✅  
- 安全层：PasswordEncoder, JWT ✅
- DTO层：LoginRequest, LoginResult ✅

📋 下一步建议：
1. 开发用户注册功能 (推荐)
2. 添加角色权限管理
3. 实现忘记密码功能

🎉 项目健康度：优秀 (95/100)
```

---

## 🔧 故障排除和常见问题

### 问题1：测试没有按预期失败

**症状**：RED阶段测试意外通过
```
❌ 问题：测试应该失败但是通过了
```

**解决方法**：
**您的输入**：`"测试没有失败，帮我检查"`

**Claude的响应**：
```
🔍 检测到RED阶段异常：测试意外通过

可能原因：
1. 实现代码已经存在  
2. 测试断言不够严格
3. Mock设置覆盖了真实行为

🛠️ 自动修复：
- 检查现有实现代码
- 加强测试断言
- 清理意外的Mock配置

修复后重新运行...
✅ 测试现在正确失败了
```

### 问题2：GREEN阶段测试仍然失败

**症状**：实现了代码但测试不通过
```
❌ 问题：添加了实现但测试仍然失败
```

**解决方法**：
**您的输入**：`"实现代码了但测试还是失败"`

**Claude的响应**：
```
🔍 GREEN阶段调试：

测试失败分析：
❌ UserLoginServiceTest.shouldLoginValidUser
   失败原因：NullPointerException at line 45
   
🕵️ 根因分析：
- UserRepository mock未正确设置
- 缺少@MockBean注解
- 测试数据构造不完整

🛠️ 修复建议：
1. 添加正确的Mock配置
2. 检查依赖注入设置
3. 完善测试数据准备

要我自动修复吗？说 "自动修复" 或 "手动调试"
```

### 问题3：REFACTOR阶段破坏了测试

**症状**：重构后测试失败
```
❌ 问题：重构破坏了现有测试
```

**解决方法**：
**您的输入**：`"重构后测试挂了"`

**Claude的响应**：
```
⚠️ REFACTOR阶段检测到回归！

失败测试：
❌ shouldRejectInvalidPassword - AssertionError

🔄 自动回滚选项：
1. 回滚到GREEN阶段状态
2. 分步重构避免大幅改动
3. 先修复测试再继续重构

选择处理方式：
- "回滚重构" - 安全回到可工作状态
- "修复测试" - 调整测试适配新实现  
- "分步重构" - 小步骤安全重构
```

---

## 📚 用户操作总结

### 🎯 关键用户命令

| 用户意图 | 推荐说法 | Claude执行工具 |
|---------|---------|---------------|
| **项目初始化** | "初始化TDD项目" | tdd_auto_init_project |
| **创建功能** | "开发XX功能" | tdd_create_feature |  
| **开始RED** | "开始RED阶段" | tdd_switch_phase |
| **进入GREEN** | "进入GREEN阶段" | tdd_switch_phase |
| **开始重构** | "进入REFACTOR阶段" | tdd_switch_phase |
| **查看状态** | "查看TDD状态" | tdd_enhanced_status |
| **完成功能** | "功能完成了" | tdd_complete_phase |
| **生成提交** | "生成提交信息" | 自动提交流程 |

### 💡 用户体验亮点

1. **自然语言交互**：无需记忆复杂的MCP工具名称
2. **智能阶段管理**：自动执行阶段切换和约束检查
3. **实时反馈**：每步操作都有详细的状态反馈
4. **错误自愈**：自动检测和修复常见TDD问题
5. **进度可视化**：清晰的项目状态和质量指标
6. **持续指导**：每个阶段完成后的下一步建议

### 🏆 成功的TDD体验标志

- ✅ 每个阶段都有明确的目标和约束
- ✅ 测试失败→通过→保持绿色的完整循环
- ✅ 代码质量在REFACTOR阶段显著提升  
- ✅ 高测试覆盖率和无技术债务
- ✅ 详细的开发历史和提交记录

---

## 🎉 总结：用户驱动的TDD开发

通过Claude TDD脚手架，您将获得：

🎯 **简单直观**：说出您的想法，Claude理解并执行
🔄 **严格流程**：自动执行TDD三阶段循环
📊 **质量保证**：持续的测试覆盖率和代码质量监控  
📝 **完整记录**：详细的开发过程和提交历史
🚀 **快速上手**：30秒完成环境配置，立即开始高质量开发

**让TDD成为您的开发习惯，让质量成为您的代码DNA！** 🤖✨