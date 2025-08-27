# TDD工作流详细说明

## 目录
1. [TDD核心理念](#tdd核心理念)
2. [三相位循环详解](#三相位循环详解)
3. [MCP工具与TDD集成](#mcp工具与tdd集成)
4. [实际项目工作流](#实际项目工作流)
5. [最佳实践和模式](#最佳实践和模式)
6. [高级TDD技巧](#高级tdd技巧)

## TDD核心理念

### TDD三定律

**第一定律**：在写出能够失败的单元测试之前，不允许写任何产品代码
**第二定律**：只允许写出刚好能够失败的单元测试，不能编译也算失败  
**第三定律**：只允许写出刚好能够通过当前失败测试的产品代码

### TDD的价值

1. **设计驱动**: 测试先行驱动良好的API设计
2. **质量保障**: 高测试覆盖率确保代码质量
3. **重构信心**: 完整测试支持安全重构
4. **文档作用**: 测试即活文档，展示使用方式
5. **快速反馈**: 快速发现问题，提高开发效率

## 三相位循环详解

### 🔴 RED阶段 - 编写失败测试

#### 目标
编写一个描述所需功能的测试，确保测试失败

#### Claude Code中的体验
```
用户: "开始RED阶段，为用户注册功能写测试"

Claude执行:
tdd_switch_phase({
  projectRoot: "/workspace/user-system",
  phase: "RED",
  featureId: "USER_REGISTRATION"
})

🔴 进入RED阶段
📝 任务: 编写会失败的测试代码
🚫 限制: 只能修改 tests/ 目录
✅ 允许: tests/unit/**, tests/integration/**
```

#### 实际操作流程

**1. 分析需求**
```java
// 基于PRD和设计文档，思考测试场景：
// - 用户注册成功场景
// - 重复用户名场景  
// - 无效邮箱场景
// - 密码强度验证场景
```

**2. 编写测试代码**
```java
@Test
@DisplayName("应该成功注册新用户")
void shouldRegisterNewUser() {
    // Given - 准备测试数据
    UserRegistrationDTO registrationDTO = UserRegistrationDTO.builder()
        .username("testuser")
        .email("test@example.com")
        .password("SecurePass123!")
        .build();
    
    // When - 执行被测试的操作
    UserRegistrationResult result = userService.registerUser(registrationDTO);
    
    // Then - 验证预期结果
    assertThat(result.isSuccess()).isTrue();
    assertThat(result.getUserId()).isNotNull();
    assertThat(result.getUserId()).isGreaterThan(0L);
    
    // 验证用户确实被保存
    User savedUser = userRepository.findByUsername("testuser");
    assertThat(savedUser).isNotNull();
    assertThat(savedUser.getEmail()).isEqualTo("test@example.com");
}
```

**3. 运行测试确认失败**
```bash
mvn test
# 预期输出：
# [ERROR] shouldRegisterNewUser: UserService不存在
# [ERROR] Tests run: 1, Failures: 0, Errors: 1
```

**4. 分析失败原因**
- ✅ 编译错误（类不存在）
- ✅ 方法不存在错误
- ❌ 业务逻辑错误（说明实现了太多）

#### RED阶段的质量标准
- 测试代码清晰表达意图
- 使用Given-When-Then结构
- 断言具体且有意义
- 失败原因明确（未实现，不是逻辑错误）

### 🟢 GREEN阶段 - 最小实现

#### 目标
编写刚好能让测试通过的最少代码

#### Claude Code中的体验
```
用户: "进入GREEN阶段，实现代码让测试通过"

Claude执行:
tdd_switch_phase({
  projectRoot: "/workspace/user-system", 
  phase: "GREEN",
  featureId: "USER_REGISTRATION"
})

🟢 进入GREEN阶段
📝 任务: 最小化实现让测试通过
🚫 限制: 不能修改 tests/ 目录
✅ 允许: src/**, 生产代码目录
```

#### 实际操作流程

**1. 创建最小实现**
```java
// 第一步：创建UserService让编译通过
@Service
public class UserService {
    public UserRegistrationResult registerUser(UserRegistrationDTO dto) {
        // 最小实现 - 直接返回成功结果
        return UserRegistrationResult.builder()
            .success(true)
            .userId(1L)  // 硬编码ID
            .build();
    }
}

// 第二步：创建必要的DTO和Entity
@Data
@Builder
public class UserRegistrationDTO {
    private String username;
    private String email; 
    private String password;
}

@Entity
public class User {
    @Id
    @GeneratedValue
    private Long id;
    private String username;
    private String email;
    // getters/setters
}
```

**2. 逐步完善直到测试通过**
```java
// 发现需要Repository，添加最小实现
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}

// 更新Service使用Repository
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    
    @Transactional
    public UserRegistrationResult registerUser(UserRegistrationDTO dto) {
        // 创建用户实体
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        
        // 保存用户
        User saved = userRepository.save(user);
        
        // 返回结果
        return UserRegistrationResult.builder()
            .success(true)
            .userId(saved.getId())
            .build();
    }
}
```

**3. 运行测试确认通过**
```bash
mvn test
# 预期输出：
# [INFO] Tests run: 1, Failures: 0, Errors: 0
# [INFO] BUILD SUCCESS
```

#### GREEN阶段的质量标准
- 测试必须通过
- 实现最简单可能的解决方案
- 不要过度设计
- 不要添加不需要的功能
- 重复代码是允许的（稍后重构）

### 🔵 REFACTOR阶段 - 重构优化

#### 目标
在保持测试通过的前提下，改善代码设计

#### Claude Code中的体验
```
用户: "进入REFACTOR阶段，优化代码质量"

Claude执行:
tdd_switch_phase({
  projectRoot: "/workspace/user-system",
  phase: "REFACTOR", 
  featureId: "USER_REGISTRATION"
})

🔵 进入REFACTOR阶段
📝 任务: 重构优化，保持测试绿色
✅ 允许: 修改生产代码和测试代码
⚠️ 原则: 不改变外部行为
```

#### 实际操作流程

**1. 识别重构机会**
```java
// Code Smell识别：
// - 缺少参数验证
// - 没有异常处理  
// - 缺少密码加密
// - 没有重复性检查
// - 方法职责过多
```

**2. 执行重构**
```java
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserValidator userValidator;
    
    @Transactional
    public UserRegistrationResult registerUser(UserRegistrationDTO dto) {
        log.info("开始用户注册流程: {}", dto.getUsername());
        
        try {
            // 1. 参数验证
            validateRegistrationRequest(dto);
            
            // 2. 业务验证
            checkUserExists(dto.getUsername(), dto.getEmail());
            
            // 3. 创建用户
            User user = buildUserFromDTO(dto);
            User savedUser = userRepository.save(user);
            
            log.info("用户注册成功: userId={}", savedUser.getId());
            return buildSuccessResult(savedUser);
            
        } catch (UserValidationException e) {
            log.warn("用户注册验证失败: {}", e.getMessage());
            return buildFailureResult(e.getMessage());
        }
    }
    
    private void validateRegistrationRequest(UserRegistrationDTO dto) {
        userValidator.validateUsername(dto.getUsername());
        userValidator.validateEmail(dto.getEmail());
        userValidator.validatePassword(dto.getPassword());
    }
    
    private void checkUserExists(String username, String email) {
        if (userRepository.findByUsername(username) != null) {
            throw new UserValidationException("用户名已存在");
        }
        if (userRepository.findByEmail(email) != null) {
            throw new UserValidationException("邮箱已被使用");
        }
    }
    
    private User buildUserFromDTO(UserRegistrationDTO dto) {
        return User.builder()
            .username(dto.getUsername())
            .email(dto.getEmail())
            .passwordHash(passwordEncoder.encode(dto.getPassword()))
            .createTime(LocalDateTime.now())
            .status(UserStatus.ACTIVE)
            .build();
    }
}
```

**3. 添加更多测试用例**
```java
@Test
@DisplayName("应该拒绝重复用户名")
void shouldRejectDuplicateUsername() {
    // Given - 已存在用户
    createExistingUser("testuser", "existing@example.com");
    
    UserRegistrationDTO dto = UserRegistrationDTO.builder()
        .username("testuser")  // 重复用户名
        .email("new@example.com")
        .password("SecurePass123!")
        .build();
    
    // When
    UserRegistrationResult result = userService.registerUser(dto);
    
    // Then
    assertThat(result.isSuccess()).isFalse();
    assertThat(result.getErrorMessage()).contains("用户名已存在");
}

@Test 
@DisplayName("应该拒绝无效邮箱格式")
void shouldRejectInvalidEmailFormat() {
    // Given
    UserRegistrationDTO dto = UserRegistrationDTO.builder()
        .username("testuser")
        .email("invalid-email")  // 无效邮箱
        .password("SecurePass123!")
        .build();
    
    // When
    UserRegistrationResult result = userService.registerUser(dto);
    
    // Then  
    assertThat(result.isSuccess()).isFalse();
    assertThat(result.getErrorMessage()).contains("邮箱格式不正确");
}
```

**4. 确保测试仍然通过**
```bash
mvn test
# 所有测试必须保持GREEN状态
# [INFO] Tests run: 3, Failures: 0, Errors: 0
```

#### REFACTOR阶段的质量标准
- 所有现有测试保持通过
- 代码更清晰、更易维护
- 消除重复代码
- 改进命名和结构
- 添加适当的错误处理

## MCP工具与TDD集成

### 自动化相位管理

```javascript
// 相位切换时的自动验证
tdd_validate_path({
  projectRoot: "/workspace/project",
  filePath: "src/main/java/Service.java"
})

// RED阶段尝试修改生产代码
返回: {
  allowed: false,
  reason: "RED阶段只允许修改测试文件"
}

// GREEN阶段修改生产代码
返回: {
  allowed: true,  
  reason: "GREEN阶段允许修改生产代码"
}
```

### 状态持久化和恢复

```javascript
// 会话状态自动保存
{
  "projectRoot": "/workspace/user-system",
  "currentFeature": "USER_REGISTRATION", 
  "currentPhase": "GREEN",
  "phaseHistory": [
    {
      "phase": "RED",
      "startedAt": "2024-01-01T10:00:00Z",
      "completedAt": "2024-01-01T10:30:00Z",
      "testsCreated": ["UserServiceTest.shouldRegisterNewUser"]
    },
    {
      "phase": "GREEN", 
      "startedAt": "2024-01-01T10:30:00Z",
      "status": "in_progress",
      "implementedClasses": ["UserService", "User"]
    }
  ],
  "testResults": {
    "total": 1,
    "passed": 1,
    "failed": 0
  }
}
```

### 智能提示和建议

```
当检测到违反TDD规则时：

用户: "帮我直接实现UserService"

Claude: ❌ 当前处于RED阶段，需要先编写测试。

建议：
1. 先编写描述UserService预期行为的测试
2. 确保测试失败（因为UserService还不存在）
3. 然后切换到GREEN阶段实现代码

要我帮您编写测试代码吗？
```

## 实际项目工作流

### 完整的特性开发流程

#### 1. 特性启动
```
用户: "开发订单管理功能"

Claude工作流:
1. tdd_create_feature() - 创建特性骨架
2. 生成PRD文档
3. 技术分析和设计
4. 创建测试规格
5. 进入TDD循环
```

#### 2. 多个TDD循环
```
特性: 订单管理
├── 循环1: 创建订单
│   ├── RED: 测试创建订单基本功能
│   ├── GREEN: 最小实现
│   └── REFACTOR: 添加验证逻辑
├── 循环2: 查询订单  
│   ├── RED: 测试查询功能
│   ├── GREEN: 实现查询
│   └── REFACTOR: 优化查询性能
└── 循环3: 更新订单状态
    ├── RED: 测试状态更新
    ├── GREEN: 实现状态机
    └── REFACTOR: 重构状态管理
```

#### 3. 质量检查和提交
```javascript
// 完成特性开发
tdd_complete_phase({
  projectRoot: "/workspace/project",
  result: "订单管理功能开发完成，测试覆盖率85%"
})

// 自动生成提交信息
feat: 实现订单管理功能

主要完成内容：
1. 订单CRUD操作
   - 创建订单接口和验证逻辑
   - 查询订单支持多种过滤条件
   - 订单状态更新和状态机管理

2. TDD实践成果
   - 3轮完整RED-GREEN-REFACTOR循环
   - 单元测试12个，集成测试5个
   - 测试覆盖率: 85%

技术亮点：
- 实现订单状态机模式
- 使用策略模式处理不同订单类型
- 添加并发安全的订单号生成器

测试覆盖率：85%
性能影响：订单查询平均响应时间<100ms

🤖 Generated with Claude Code (claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 团队协作工作流

#### 配置共享
```bash
# 团队Leader导出标准配置
npx @claude-tdd/scaffold export --output=team-tdd-config.json

# 团队成员导入配置
npx @claude-tdd/scaffold import --config=team-tdd-config.json
```

#### 分支策略
```bash
# 每个TDD循环创建分支
git checkout -b feature/user-login-red
# RED阶段提交
git add tests/
git commit -m "test: add user login tests (RED)"

git checkout -b feature/user-login-green  
# GREEN阶段提交
git add src/
git commit -m "feat: implement user login (GREEN)"

git checkout -b feature/user-login-refactor
# REFACTOR阶段提交
git add src/
git commit -m "refactor: improve user login implementation"
```

## 最佳实践和模式

### 测试命名约定

```java
// 标准格式: should_预期行为_when_触发条件
@Test 
@DisplayName("应该返回用户信息_当提供有效用户ID时")
void should_returnUserInfo_when_validUserIdProvided() {
    // 实现
}

@Test
@DisplayName("应该抛出异常_当用户不存在时") 
void should_throwException_when_userNotExists() {
    // 实现
}
```

### AAA模式（Arrange-Act-Assert）

```java
@Test
void shouldCalculateOrderTotal() {
    // Arrange (Given) - 准备测试数据
    Order order = new Order();
    order.addItem(new OrderItem("商品A", 100.0, 2));
    order.addItem(new OrderItem("商品B", 50.0, 1));
    OrderCalculator calculator = new OrderCalculator();
    
    // Act (When) - 执行被测试的操作  
    BigDecimal total = calculator.calculateTotal(order);
    
    // Assert (Then) - 验证结果
    assertThat(total).isEqualByComparingTo(new BigDecimal("250.0"));
}
```

### 测试数据构造模式

```java
// 使用Builder模式构造测试数据
public class UserTestDataBuilder {
    public static UserTestDataBuilder aUser() {
        return new UserTestDataBuilder();
    }
    
    public User withUsername(String username) {
        this.username = username;
        return this;
    }
    
    public User build() {
        return User.builder()
            .username(username)
            .email(email)
            .build();
    }
}

// 测试中使用
@Test
void shouldValidateUser() {
    // Given
    User user = aUser()
        .withUsername("testuser")
        .withEmail("test@example.com")
        .build();
    
    // When & Then
    assertThat(userValidator.validate(user)).isTrue();
}
```

### 异常测试模式

```java
@Test
@DisplayName("应该抛出ValidationException_当用户名为空时")
void should_throwValidationException_when_usernameIsEmpty() {
    // Given
    UserRegistrationDTO dto = UserRegistrationDTO.builder()
        .username("")  // 空用户名
        .email("test@example.com")
        .password("password123")
        .build();
    
    // When & Then
    assertThatThrownBy(() -> userService.registerUser(dto))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("用户名不能为空");
}
```

## 高级TDD技巧

### 参数化测试

```java
@ParameterizedTest
@DisplayName("应该正确验证各种邮箱格式")
@CsvSource({
    "test@example.com, true",
    "user.name@domain.com, true", 
    "invalid.email, false",
    "@example.com, false",
    "test@, false"
})
void shouldValidateEmailFormats(String email, boolean expected) {
    // When
    boolean result = EmailValidator.isValid(email);
    
    // Then
    assertThat(result).isEqualTo(expected);
}
```

### 测试替身(Test Doubles)

```java
@Test
@DisplayName("应该发送通知邮件_当用户注册成功时")
void should_sendNotificationEmail_when_userRegistrationSucceeds() {
    // Given
    EmailService mockEmailService = mock(EmailService.class);
    UserService userService = new UserService(userRepository, mockEmailService);
    
    UserRegistrationDTO dto = createValidRegistrationDTO();
    
    // When
    userService.registerUser(dto);
    
    // Then
    verify(mockEmailService).sendWelcomeEmail(
        eq(dto.getEmail()), 
        eq(dto.getUsername())
    );
}
```

### 集成测试策略

```java
@SpringBootTest
@Testcontainers
class UserServiceIntegrationTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:13")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");
    
    @Test
    @Transactional
    @DisplayName("完整用户注册流程测试")
    void shouldCompleteUserRegistrationFlow() {
        // Given - 完整的系统环境
        
        // When - 执行完整业务流程
        
        // Then - 验证系统状态变更
    }
}
```

### 性能测试集成

```java
@Test
@DisplayName("用户查询性能应在100ms内")
void userQueryShouldCompleteWithin100ms() {
    // Given
    createTestUsers(1000);
    
    // When & Then
    assertTimeout(Duration.ofMillis(100), () -> {
        List<User> users = userService.findActiveUsers();
        assertThat(users).hasSizeGreaterThan(0);
    });
}
```

### 测试组织策略

```java
// 使用嵌套测试组织相关测试
@DisplayName("用户服务测试")
class UserServiceTest {
    
    @Nested
    @DisplayName("用户注册功能")
    class UserRegistration {
        
        @Test
        @DisplayName("成功注册场景")
        void shouldRegisterUserSuccessfully() {
            // 实现
        }
        
        @Test
        @DisplayName("重复用户名场景")
        void shouldRejectDuplicateUsername() {
            // 实现
        }
    }
    
    @Nested
    @DisplayName("用户认证功能") 
    class UserAuthentication {
        
        @Test
        @DisplayName("有效凭据认证")
        void shouldAuthenticateWithValidCredentials() {
            // 实现
        }
        
        @Test
        @DisplayName("无效凭据认证")
        void shouldRejectInvalidCredentials() {
            // 实现  
        }
    }
}
```

---

## 总结

TDD不仅仅是一种测试方法，更是一种设计方法。通过严格的RED-GREEN-REFACTOR循环，我们可以：

1. **驱动良好设计**: 测试先行迫使我们思考API设计
2. **确保质量**: 高测试覆盖率和持续验证
3. **支持重构**: 安全的代码改进和优化
4. **提高信心**: 快速反馈和错误发现
5. **加速开发**: 减少调试时间，提高开发效率

结合Claude TDD脚手架的MCP工具，我们可以自动化这个流程，确保严格遵循TDD原则，让高质量开发成为默认选择。

🎯 **记住**: TDD是一种纪律，需要持续练习和坚持。通过Claude Code的自动化支持，让我们专注于业务逻辑实现，而将TDD流程的执行交给工具来保证。