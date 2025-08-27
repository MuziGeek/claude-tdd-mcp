import { createLogger } from '../utils/logger.js';

const logger = createLogger('CommandSystem');

/**
 * 智能命令系统
 * 提供自然语言意图识别、短命令别名和统一命令入口
 */
class SmartCommandSystem {
  constructor(toolRegistry, sessionManager) {
    this.toolRegistry = toolRegistry;
    this.sessionManager = sessionManager;
    this.initializeIntentPatterns();
    this.initializeAliases();
  }

  /**
   * 初始化意图识别模式
   */
  initializeIntentPatterns() {
    this.intentPatterns = [
      // 项目初始化相关
      {
        patterns: [
          /初始化.*?项目|开始.*?项目|创建.*?项目|新建.*?项目/,
          /init.*?project|create.*?project|start.*?project/i
        ],
        intent: 'initialize_project',
        tool: 'tdd_initialize',
        description: '初始化TDD项目'
      },

      // TDD阶段切换相关
      {
        patterns: [
          /写测试|编写测试|测试阶段|红灯|red.*?phase/i,
          /进入.*?red|切换.*?red|开始.*?测试/
        ],
        intent: 'switch_to_red',
        tool: 'tdd_switch_phase',
        params: { phase: 'RED' },
        description: '切换到RED阶段，编写失败测试'
      },

      {
        patterns: [
          /实现代码|写代码|绿灯|green.*?phase/i,
          /进入.*?green|切换.*?green|开始.*?实现/
        ],
        intent: 'switch_to_green',
        tool: 'tdd_switch_phase',
        params: { phase: 'GREEN' },
        description: '切换到GREEN阶段，编写实现代码'
      },

      {
        patterns: [
          /重构|优化代码|refactor.*?phase/i,
          /进入.*?refactor|切换.*?refactor|开始.*?重构/
        ],
        intent: 'switch_to_refactor',
        tool: 'tdd_switch_phase',
        params: { phase: 'REFACTOR' },
        description: '切换到REFACTOR阶段，重构代码'
      },

      // 特性管理相关
      {
        patterns: [
          /创建.*?功能|新建.*?特性|开发.*?功能|添加.*?功能/,
          /create.*?feature|add.*?feature|new.*?feature/i
        ],
        intent: 'create_feature',
        tool: 'tdd_create_feature',
        description: '创建新功能特性'
      },

      // 状态查询相关
      {
        patterns: [
          /查看状态|当前状态|项目状态|TDD状态/,
          /status|current.*?state|project.*?state/i
        ],
        intent: 'get_status',
        tool: 'tdd_enhanced_status',
        description: '获取当前TDD状态'
      },

      {
        patterns: [
          /状态仪表盘|仪表盘|详细状态|完整状态/,
          /dashboard|detailed.*?status|full.*?status/i
        ],
        intent: 'get_dashboard',
        tool: 'tdd_status_dashboard',
        description: '获取状态仪表盘'
      },

      {
        patterns: [
          /项目健康|健康度|项目质量|代码质量/,
          /project.*?health|health.*?check|code.*?quality/i
        ],
        intent: 'get_health',
        tool: 'tdd_project_health',
        description: '获取项目健康度'
      },

      {
        patterns: [
          /进度报告|开发进度|TDD进度|进展情况/,
          /progress.*?report|development.*?progress|tdd.*?progress/i
        ],
        intent: 'get_progress',
        tool: 'tdd_progress_report',
        description: '获取进度报告'
      },

      // 项目分析相关
      {
        patterns: [
          /分析项目|扫描项目|项目分析|深度分析/,
          /analyze.*?project|scan.*?project|deep.*?analysis/i
        ],
        intent: 'analyze_project',
        tool: 'tdd_deep_analyze',
        description: '深度分析项目结构'
      },

      // 零配置初始化相关
      {
        patterns: [
          /自动初始化|智能初始化|零配置|快速开始|一键初始化|智能配置/,
          /auto.*?init|zero.*?config|quick.*?start|smart.*?setup/i
        ],
        intent: 'auto_init',
        tool: 'tdd_auto_init_project',
        description: '自动检测并初始化项目'
      },

      {
        patterns: [
          /检测项目|识别项目|项目检测|项目类型/,
          /detect.*?project|identify.*?project|project.*?type/i
        ],
        intent: 'detect_project',
        tool: 'tdd_detect_project',
        description: '检测项目类型和技术栈'
      },

      {
        patterns: [
          /配置建议|推荐配置|优化建议|配置方案/,
          /config.*?suggestion|recommend.*?config|optimization.*?advice/i
        ],
        intent: 'config_suggestions',
        tool: 'tdd_config_suggestions',
        description: '生成配置建议'
      },

      {
        patterns: [
          /应用配置|采用配置|使用配置|应用推荐/,
          /apply.*?config|use.*?config|adopt.*?config/i
        ],
        intent: 'apply_config',
        tool: 'tdd_apply_config',
        description: '应用推荐的配置'
      },

      {
        patterns: [
          /验证配置|检查配置|配置验证|配置检查/,
          /validate.*?config|check.*?config|verify.*?setup/i
        ],
        intent: 'validate_config',
        tool: 'tdd_validate_config',
        description: '验证项目配置'
      },

      {
        patterns: [
          /初始化状态|配置状态|准备状态|就绪状态/,
          /init.*?status|setup.*?status|ready.*?status/i
        ],
        intent: 'init_status',
        tool: 'tdd_init_status',
        description: '检查初始化状态'
      },

      // 自动测试相关
      {
        patterns: [
          /启动.*?自动测试|开启.*?自动测试|自动测试|监听测试/,
          /start.*?auto.*?test|enable.*?auto.*?test|watch.*?test/i
        ],
        intent: 'start_auto_test',
        tool: 'tdd_start_auto_test',
        description: '启动自动测试监听'
      },

      {
        patterns: [
          /停止.*?自动测试|关闭.*?自动测试|停止监听/,
          /stop.*?auto.*?test|disable.*?auto.*?test|stop.*?watch/i
        ],
        intent: 'stop_auto_test',
        tool: 'tdd_stop_auto_test',
        description: '停止自动测试监听'
      },

      {
        patterns: [
          /运行测试|执行测试|跑测试|测试一下/,
          /run.*?test|execute.*?test|trigger.*?test/i
        ],
        intent: 'trigger_test',
        tool: 'tdd_trigger_test',
        description: '手动触发测试运行'
      },

      {
        patterns: [
          /测试结果|测试报告|查看测试|测试状态/,
          /test.*?result|test.*?report|test.*?status/i
        ],
        intent: 'get_test_result',
        tool: 'tdd_get_test_result',
        description: '获取测试结果'
      },

      // 帮助相关
      {
        patterns: [
          /帮助|使用说明|如何使用|命令列表/,
          /help|usage|how.*?to.*?use|commands/i
        ],
        intent: 'show_help',
        tool: 'show_help',
        description: '显示帮助信息'
      }
    ];
  }

  /**
   * 初始化命令别名
   */
  initializeAliases() {
    this.aliases = new Map([
      // 简短别名
      ['tdd', 'tdd_enhanced_status'],
      ['status', 'tdd_enhanced_status'],
      ['dashboard', 'tdd_status_dashboard'],
      ['health', 'tdd_project_health'],
      ['progress', 'tdd_progress_report'],
      ['init', 'tdd_initialize'],
      ['red', 'tdd_switch_phase --phase=RED'],
      ['green', 'tdd_switch_phase --phase=GREEN'],
      ['refactor', 'tdd_switch_phase --phase=REFACTOR'],
      ['feature', 'tdd_create_feature'],
      ['analyze', 'tdd_deep_analyze'],
      ['scan', 'tdd_scan_project'],
      ['autotest', 'tdd_start_auto_test'],
      ['watch', 'tdd_start_auto_test'],
      ['test', 'tdd_trigger_test'],
      ['result', 'tdd_get_test_result'],
      
      // 中文别名
      ['状态', 'tdd_enhanced_status'],
      ['仪表盘', 'tdd_status_dashboard'],
      ['健康度', 'tdd_project_health'],
      ['进度', 'tdd_progress_report'],
      ['初始化', 'tdd_initialize'],
      ['扫描', 'tdd_scan_project'],
      ['分析', 'tdd_deep_analyze'],
      ['红灯', 'tdd_switch_phase --phase=RED'],
      ['绿灯', 'tdd_switch_phase --phase=GREEN'],
      ['重构', 'tdd_switch_phase --phase=REFACTOR'],
      ['功能', 'tdd_create_feature'],
      ['自动测试', 'tdd_start_auto_test'],
      ['测试结果', 'tdd_get_test_result'],
      ['运行测试', 'tdd_trigger_test'],
      
      // 零配置初始化别名
      ['自动初始化', 'tdd_auto_init_project'],
      ['检测项目', 'tdd_detect_project'],
      ['配置建议', 'tdd_config_suggestions'],
      ['应用配置', 'tdd_apply_config'],
      ['验证配置', 'tdd_validate_config'],
      ['初始化状态', 'tdd_init_status'],
      
      // 常用组合
      ['开始tdd', 'tdd_initialize'],
      ['快速开始', 'tdd_auto_init_project'],
      ['一键初始化', 'tdd_auto_init_project'],
      ['智能配置', 'tdd_auto_init_project'],
      ['查看状态', 'tdd_get_status'],
      ['写测试', 'tdd_switch_phase --phase=RED'],
      ['写代码', 'tdd_switch_phase --phase=GREEN'],
      ['优化代码', 'tdd_switch_phase --phase=REFACTOR'],
      ['启动自动测试', 'tdd_start_auto_test'],
      ['查看测试结果', 'tdd_get_test_result']
    ]);
  }

  /**
   * 处理自然语言输入
   */
  async processNaturalLanguage(input, projectRoot) {
    logger.info(`处理自然语言输入: ${input}`);
    
    try {
      // 1. 意图识别
      const intent = this.recognizeIntent(input);
      
      if (!intent) {
        return this.generateSuggestions(input);
      }

      // 2. 参数提取
      const params = await this.extractParameters(input, intent, projectRoot);

      // 3. 执行命令
      const result = await this.executeCommand(intent, params);

      logger.info(`自然语言处理成功: ${intent.intent}`);
      
      return {
        success: true,
        intent: intent.intent,
        description: intent.description,
        result,
        suggestions: this.getNextStepSuggestions(intent.intent, result)
      };

    } catch (error) {
      logger.error('自然语言处理失败:', error);
      
      return {
        success: false,
        error: error.message,
        suggestions: this.getErrorSuggestions(input)
      };
    }
  }

  /**
   * 识别用户意图
   */
  recognizeIntent(input) {
    const normalizedInput = input.toLowerCase().trim();
    
    for (const intentPattern of this.intentPatterns) {
      for (const pattern of intentPattern.patterns) {
        if (pattern.test(normalizedInput)) {
          return intentPattern;
        }
      }
    }
    
    return null;
  }

  /**
   * 提取命令参数
   */
  async extractParameters(input, intent, projectRoot) {
    const baseParams = {
      projectRoot,
      ...intent.params
    };

    // 根据意图类型提取特定参数
    switch (intent.intent) {
      case 'create_feature':
        return this.extractFeatureParams(input, baseParams);
      
      case 'initialize_project':
        return this.extractInitParams(input, baseParams);
      
      default:
        return baseParams;
    }
  }

  /**
   * 提取功能创建参数
   */
  extractFeatureParams(input, baseParams) {
    // 提取功能ID和描述
    const featurePatterns = [
      /(?:创建|开发|添加|新建).*?["']([^"']+)["'].*?功能/,
      /(?:功能|特性).*?["']([^"']+)["']/,
      /(?:create|add|new).*?feature.*?["']([^"']+)["']/i
    ];

    let featureId = null;
    let description = input;

    for (const pattern of featurePatterns) {
      const match = input.match(pattern);
      if (match) {
        description = match[1];
        featureId = description
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_\u4e00-\u9fff]/g, '')
          .toUpperCase();
        break;
      }
    }

    // 如果没有找到具体功能，生成通用ID
    if (!featureId) {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      featureId = `FEATURE_${timestamp}`;
    }

    return {
      ...baseParams,
      featureId,
      description
    };
  }

  /**
   * 提取初始化参数
   */
  extractInitParams(input, baseParams) {
    // 提取项目类型
    const typePatterns = [
      { pattern: /java|spring|maven/, profile: 'java-spring' },
      { pattern: /node|express|javascript|js/, profile: 'node-express' },
      { pattern: /python|django|py/, profile: 'python-django' },
      { pattern: /react|前端|frontend/, profile: 'react' }
    ];

    let profile = 'java-spring'; // 默认

    for (const { pattern, profile: profileName } of typePatterns) {
      if (pattern.test(input.toLowerCase())) {
        profile = profileName;
        break;
      }
    }

    return {
      ...baseParams,
      profile
    };
  }

  /**
   * 执行命令
   */
  async executeCommand(intent, params) {
    if (intent.tool === 'show_help') {
      return this.generateHelpInfo();
    }

    const tool = this.toolRegistry.getTool(intent.tool);
    if (!tool) {
      throw new Error(`工具不存在: ${intent.tool}`);
    }

    return await tool.handler(params, this.sessionManager);
  }

  /**
   * 解析别名命令
   */
  resolveAlias(input) {
    const trimmedInput = input.trim();
    
    // 检查完整匹配
    if (this.aliases.has(trimmedInput)) {
      return this.aliases.get(trimmedInput);
    }

    // 检查前缀匹配
    for (const [alias, command] of this.aliases) {
      if (trimmedInput.startsWith(alias + ' ')) {
        const additionalArgs = trimmedInput.slice(alias.length + 1);
        return `${command} ${additionalArgs}`;
      }
    }

    return input;
  }

  /**
   * 生成建议
   */
  generateSuggestions(input) {
    const suggestions = [
      '🤖 我没有完全理解您的意图，请尝试以下命令：',
      '',
      '📋 **常用命令**：',
      '- `tdd` 或 `状态` - 查看当前TDD状态',
      '- `red` 或 `写测试` - 切换到RED阶段',
      '- `green` 或 `写代码` - 切换到GREEN阶段',
      '- `refactor` 或 `重构` - 切换到REFACTOR阶段',
      '',
      '🎯 **功能开发**：',
      '- `开发用户登录功能` - 创建新功能',
      '- `分析项目` - 深度分析项目结构',
      '',
      '💡 **提示**: 您也可以使用自然语言描述您想要做的事情'
    ];

    return {
      success: false,
      message: '未识别的命令',
      suggestions: suggestions.join('\n')
    };
  }

  /**
   * 获取下一步建议
   */
  getNextStepSuggestions(intent, result) {
    const suggestions = {
      'initialize_project': [
        '✅ 项目初始化完成！',
        '📝 下一步可以：',
        '- 输入 `开发[功能名称]功能` 创建第一个功能',
        '- 输入 `分析项目` 了解项目结构'
      ],
      
      'switch_to_red': [
        '🔴 已切换到RED阶段',
        '📝 现在应该：',
        '- 编写会失败的测试代码',
        '- 明确定义功能需求',
        '- 完成后输入 `green` 或 `写代码`'
      ],
      
      'switch_to_green': [
        '🟢 已切换到GREEN阶段',
        '📝 现在应该：',
        '- 编写最小代码使测试通过',
        '- 不要过度设计',
        '- 完成后输入 `refactor` 或 `重构`'
      ],
      
      'switch_to_refactor': [
        '🔧 已切换到REFACTOR阶段',
        '📝 现在应该：',
        '- 改进代码质量',
        '- 保持测试通过',
        '- 完成后可以开始新的TDD循环'
      ],
      
      'create_feature': [
        '🎯 功能创建成功！',
        '📝 建议的开发流程：',
        '- 输入 `red` 开始编写测试',
        '- 遵循TDD的红-绿-重构循环'
      ]
    };

    return suggestions[intent] || [];
  }

  /**
   * 获取错误建议
   */
  getErrorSuggestions(input) {
    return [
      '❌ 命令执行失败',
      '💡 请检查：',
      '- 项目路径是否正确',
      '- 是否已正确初始化TDD项目',
      '- 输入 `help` 查看可用命令'
    ];
  }

  /**
   * 生成帮助信息
   */
  generateHelpInfo() {
    return {
      success: true,
      data: {
        title: '🚀 Claude TDD脚手架 - 智能命令帮助',
        sections: [
          {
            title: '🗣️ 自然语言命令',
            items: [
              '- "开发用户登录功能" - 创建新功能',
              '- "写测试" - 切换到RED阶段',
              '- "写代码" - 切换到GREEN阶段',
              '- "重构代码" - 切换到REFACTOR阶段',
              '- "查看状态" - 获取当前TDD状态',
              '- "分析项目" - 深度分析项目结构'
            ]
          },
          {
            title: '⚡ 快捷别名',
            items: [
              '- `tdd` - 查看状态',
              '- `red` - RED阶段',
              '- `green` - GREEN阶段',
              '- `refactor` - REFACTOR阶段',
              '- `init` - 初始化项目',
              '- `analyze` - 分析项目'
            ]
          },
          {
            title: '🎯 TDD流程',
            items: [
              '1. 🔴 RED: 编写失败测试',
              '2. 🟢 GREEN: 编写最小实现',
              '3. 🔧 REFACTOR: 重构优化',
              '4. 🔄 重复循环'
            ]
          }
        ]
      },
      message: '智能命令系统帮助信息'
    };
  }

  /**
   * 获取所有可用别名
   */
  getAllAliases() {
    const aliasGroups = {
      '基础命令': ['tdd', 'init', 'status', 'help'],
      'TDD阶段': ['red', 'green', 'refactor'],
      '项目管理': ['feature', 'analyze', 'scan'],
      '中文命令': ['状态', '初始化', '红灯', '绿灯', '重构']
    };

    return aliasGroups;
  }
}

export { SmartCommandSystem };