# Claude TDD脚手架快速开始指南

## 🚀 30秒快速上手

### 一键安装配置

```bash
# 在项目目录中执行一个命令即可完成所有配置
cd your-project
npx claude-tdd-mcp init --profile=auto
```

### 重启Claude Desktop

```bash
# 完全关闭Claude Desktop
# 重新启动Claude Desktop
```

### 开始TDD开发

```
在Claude Code中说: "我要开发一个用户登录功能"
```

就这么简单！🎉

---

## 📋 详细步骤

### 步骤1: 环境检查（1分钟）

确保已安装：
- ✅ Claude Desktop
- ✅ Node.js >= 16.0.0
- ✅ 开发环境（Java/Maven, Node.js/npm, Python/pip等）

### 步骤2: 安装TDD脚手架（30秒）

**选项A: 一键配置（推荐）**
```bash
npx claude-tdd-mcp init --profile=auto
```

**选项B: 分步配置**
```bash
npx claude-tdd-mcp init --profile=java-spring
# MCP配置会自动完成
```

**选项C: 全局安装**
```bash
npm install -g claude-tdd-mcp
claude-tdd-mcp init /path/to/project
```

### 步骤3: 重启Claude Desktop（30秒）

这一步很重要！MCP服务需要重启后才能加载。

### 步骤4: 验证安装（30秒）

打开Claude Code，输入：
```
"列出TDD工具"
```

如果看到Claude TDD MCP工具列表，说明安装成功！

### 步骤5: 开始TDD开发（立即开始）

```
"我要开发一个客户管理功能"
```

Claude将自动：
1. 创建功能骨架
2. 编写PRD文档
3. 进行技术分析
4. 生成测试用例
5. 启动TDD循环

---

## 🎯 第一个TDD功能示例（5分钟体验）

### 创建功能

```
用户: "开发一个简单的计算器加法功能"

Claude: 让我为您创建计算器加法功能...
[自动创建项目结构和文档]

✅ 功能创建完成！
- 特性ID: CALCULATOR_ADD
- 当前阶段: TDD RED
```

### TDD循环体验

#### RED阶段 - 写测试
```
用户: "写测试代码"

Claude: [自动生成]
@Test
void shouldAddTwoNumbers() {
    // Given
    Calculator calculator = new Calculator();
    
    // When  
    int result = calculator.add(2, 3);
    
    // Then
    assertEquals(5, result);
}

运行测试: ❌ 失败 (Calculator类不存在)
```

#### GREEN阶段 - 写实现
```
用户: "实现代码让测试通过"

Claude: [自动生成]
public class Calculator {
    public int add(int a, int b) {
        return a + b;  // 最小实现
    }
}

运行测试: ✅ 通过
```

#### REFACTOR阶段 - 重构
```
用户: "优化代码"

Claude: [重构代码]
public class Calculator {
    public int add(int a, int b) {
        validateInput(a, b);
        return a + b;
    }
    
    private void validateInput(int a, int b) {
        // 添加参数验证逻辑
    }
}

运行测试: ✅ 保持通过
```

🎉 完成第一个TDD循环！

---

## 🔧 常用命令速查

### MCP工具命令（在Claude Code中使用）

```javascript
// 🤖 智能命令（推荐使用）
tdd_smart_command({
  projectRoot: "/path/to/project",
  input: "初始化项目"  // 或 "开始TDD", "red", "状态" 等
})

// 查看项目状态
tdd_get_status({ projectRoot: "/path/to/project" })

// 零配置初始化
tdd_auto_init_project({ projectRoot: "/path/to/project" })

// 创建新功能
tdd_create_feature({ 
  projectRoot: "/path/to/project",
  featureId: "USER_LOGIN",
  description: "用户登录功能"
})

// 切换TDD阶段
tdd_switch_phase({
  projectRoot: "/path/to/project", 
  phase: "RED"  // RED, GREEN, REFACTOR
})

// 深度分析项目
tdd_deep_analyze({ projectRoot: "/path/to/project" })
```

### 终端命令

```bash
# 查看帮助
npx claude-tdd-mcp --help

# 初始化不同类型项目
npx claude-tdd-mcp init --profile=node-express
npx claude-tdd-mcp init --profile=python-django

# 检测项目类型
npx claude-tdd-mcp detect /path/to/project
```

---

## 🎨 项目类型支持

| 项目类型 | Profile参数 | 测试框架 | 构建工具 |
|---------|------------|---------|---------|
| Java Spring Boot | `java-spring` | JUnit 5 | Maven |
| Node.js Express | `node-express` | Jest | npm |
| Python Django | `python-django` | pytest | pip |
| 纯JavaScript | `javascript` | Jest | npm |
| TypeScript | `typescript` | Jest | npm |

---

## 🆘 快速故障排除

### 问题：看不到TDD工具

**解决**：
```bash
# 1. 重启Claude Desktop
# 2. 重新安装全局包
npm install -g claude-tdd-mcp
```

### 问题：TDD阶段切换失败

**解决**：
```
在Claude Code中说: "重置TDD状态"
```

### 问题：测试运行失败

**解决**：
```bash
# Java项目
mvn clean install

# Node.js项目  
npm install

# Python项目
pip install -r requirements.txt
```

---

## 📚 下一步学习

- 📖 [完整用户指南](USER-GUIDE.md) - 详细操作说明
- 🔄 [TDD工作流详解](TDD-WORKFLOW.md) - 深入理解TDD流程
- 🛠 [高级功能](USER-GUIDE.md#高级功能) - 项目分析、配置管理等

---

## 💡 小贴士

1. **保持小步前进**: 每次只实现一个小功能
2. **先写测试**: 严格遵循TDD的RED-GREEN-REFACTOR循环
3. **利用AI代理**: 让专业代理处理PRD、分析、测试等工作
4. **频繁提交**: 每完成一个TDD循环就提交代码
5. **善用状态恢复**: Claude可以跨对话恢复项目状态

---

🎉 **准备开始高效的TDD开发之旅吧！**

有任何问题，随时在Claude Code中问我："如何使用TDD脚手架？"