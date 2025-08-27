import { createLogger } from '../utils/logger.js';
import { handleInitializeProject } from './initialization.js';
import { handleScanProject, handleDeepAnalyze } from './scanning.js';
import { handleValidateEnvironment } from './validation.js';
import { handleGetStatus, handleExportConfig, handleImportConfig } from './configuration.js';
import { handleExportAnalysis, handleImportAnalysis, handleCompareAnalysis, handleApplyAnalysis } from './analysis.js';
import { handleManageProfiles } from './profiles.js';
import { handleSwitchPhase, handleGetTDDStatus, handleCreateFeature, handleCompletePhase, handleValidateFilePath } from './tdd-workflow.js';
import { handleSmartCommand, handleListAliases, handleSmartHelp } from './smart-command.js';
import { handleStartAutoTest, handleStopAutoTest, handleTriggerTest, handleGetTestResult, handleGetTestSuggestions, handleGetAutoTestStatus } from './auto-test.js';
import { handleGetEnhancedStatus, handleGetStatusDashboard, handleGetContextTips, handleGetProjectHealth, handleGetProgressReport } from './status-display.js';
import { handleAutoInitProject, handleDetectProject, handleGenerateConfigSuggestions, handleApplyRecommendedConfig, handleValidateProjectConfig, handleGetInitStatus } from './auto-init.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const logger = createLogger('ToolRegistry');

/**
 * MCP工具定义
 */
const TOOL_DEFINITIONS = [
  // 智能命令系统
  {
    name: 'tdd_smart_command',
    description: '🤖 智能命令 - 使用自然语言或别名执行TDD操作 (推荐)',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        input: {
          type: 'string',
          description: '自然语言输入或命令别名，如: "开发用户登录功能", "写测试", "red", "状态" 等'
        }
      },
      required: ['projectRoot', 'input']
    },
    handler: async (args, sessionManager) => {
      // 需要传递工具注册表实例
      const toolRegistry = {
        getTool: (name) => TOOL_DEFINITIONS.find(tool => tool.name === name)
      };
      return await handleSmartCommand(args, sessionManager, toolRegistry);
    }
  },

  {
    name: 'tdd_list_aliases',
    description: '📋 显示所有可用的命令别名',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args, sessionManager) => {
      const toolRegistry = {
        getTool: (name) => TOOL_DEFINITIONS.find(tool => tool.name === name)
      };
      return await handleListAliases(args, sessionManager, toolRegistry);
    }
  },

  {
    name: 'tdd_smart_help',
    description: '❓ 智能命令帮助 - 显示自然语言命令使用指南',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    handler: async (args, sessionManager) => {
      const toolRegistry = {
        getTool: (name) => TOOL_DEFINITIONS.find(tool => tool.name === name)
      };
      return await handleSmartHelp(args, sessionManager, toolRegistry);
    }
  },
  {
    name: 'tdd_initialize',
    description: '🚀 初始化项目 - 在指定路径设置TDD脚手架环境',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        profile: {
          type: 'string',
          description: '项目配置类型 (java-spring, node-express, python-django 等)',
          enum: ['java-spring', 'node-express', 'python-django', 'java', 'javascript', 'python']
        },
        force: {
          type: 'boolean',
          description: '强制覆盖现有配置',
          default: false
        },
        skipTaskMaster: {
          type: 'boolean',
          description: '跳过Task Master集成',
          default: false
        }
      },
      required: ['projectRoot']
    },
    handler: handleInitializeProject
  },
  
  {
    name: 'tdd_scan_project',
    description: '🔍 扫描项目 - 分析项目结构、代码特性和配置',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        deep: {
          type: 'boolean',
          description: '是否进行深度分析',
          default: false
        }
      },
      required: ['projectRoot']
    },
    handler: handleScanProject
  },
  
  {
    name: 'tdd_deep_analyze',
    description: '🧠 深度分析 - 分析架构、测试策略、依赖关系和代码模式',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleDeepAnalyze
  },
  
  {
    name: 'tdd_validate_env',
    description: '✅ 环境验证 - 检查Claude Code环境和TDD配置状态',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleValidateEnvironment
  },
  
  {
    name: 'tdd_get_status',
    description: '📊 状态查询 - 获取当前TDD状态和项目信息',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetStatus
  },
  
  {
    name: 'tdd_export_config',
    description: '📤 导出配置 - 将当前项目的TDD配置导出为文件',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        outputPath: {
          type: 'string',
          description: '导出文件路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleExportConfig
  },
  
  {
    name: 'tdd_import_config',
    description: '📥 导入配置 - 从配置文件导入TDD项目设置',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        configPath: {
          type: 'string',
          description: '配置文件路径'
        },
        force: {
          type: 'boolean',
          description: '强制覆盖现有配置',
          default: false
        }
      },
      required: ['projectRoot', 'configPath']
    },
    handler: handleImportConfig
  },
  
  {
    name: 'tdd_export_analysis',
    description: '📊 导出分析 - 导出项目深度分析结果和报告',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        outputPath: {
          type: 'string',
          description: '导出文件路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleExportAnalysis
  },
  
  {
    name: 'tdd_import_analysis',
    description: '📥 导入分析 - 导入其他项目的分析结果进行参考',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '目标项目根目录的绝对路径'
        },
        analysisPath: {
          type: 'string',
          description: '分析文件路径'
        }
      },
      required: ['projectRoot', 'analysisPath']
    },
    handler: handleImportAnalysis
  },
  
  {
    name: 'tdd_compare_analysis',
    description: '🔀 对比分析 - 比较当前项目与其他项目的分析结果',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleCompareAnalysis
  },
  
  {
    name: 'tdd_apply_analysis',
    description: '🎯 应用分析 - 将分析结果应用到TDD流程和项目配置',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        skipTestStrategy: {
          type: 'boolean',
          description: '跳过测试策略推荐',
          default: false
        },
        skipTools: {
          type: 'boolean',
          description: '跳过工具推荐',
          default: false
        },
        skipWorkflow: {
          type: 'boolean',
          description: '跳过工作流推荐',
          default: false
        }
      },
      required: ['projectRoot']
    },
    handler: handleApplyAnalysis
  },
  
  {
    name: 'tdd_manage_profiles',
    description: '📋 模板管理 - 管理和操作项目配置模板',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'export', 'import', 'delete'],
          description: '操作类型'
        },
        profileName: {
          type: 'string',
          description: '配置模板名称（用于export/import/delete操作）'
        },
        filePath: {
          type: 'string',
          description: '文件路径（用于export/import操作）'
        }
      },
      required: ['action']
    },
    handler: handleManageProfiles
  },

  // TDD工作流工具
  {
    name: 'tdd_switch_phase',
    description: '🔄 阶段切换 - 切换TDD阶段 (🔴RED/🟢GREEN/🔧REFACTOR)',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        phase: {
          type: 'string',
          enum: ['RED', 'GREEN', 'REFACTOR', 'red', 'green', 'refactor'],
          description: 'TDD阶段'
        },
        featureId: {
          type: 'string',
          description: '特性ID（可选）'
        }
      },
      required: ['projectRoot', 'phase']
    },
    handler: handleSwitchPhase
  },

  {
    name: 'tdd_get_status',
    description: '获取当前TDD状态和阶段信息',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetTDDStatus
  },

  {
    name: 'tdd_create_feature',
    description: '🎯 创建功能 - 开始新功能的TDD开发流程',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        featureId: {
          type: 'string',
          description: '特性唯一标识符'
        },
        description: {
          type: 'string',
          description: '特性描述'
        }
      },
      required: ['projectRoot', 'featureId']
    },
    handler: handleCreateFeature
  },

  {
    name: 'tdd_complete_phase',
    description: '✅ 完成阶段 - 标记当前TDD阶段为完成并获取下一步建议',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        result: {
          type: 'string',
          description: '阶段完成结果描述'
        }
      },
      required: ['projectRoot']
    },
    handler: handleCompletePhase
  },

  {
    name: 'tdd_validate_path',
    description: '🛡️ 路径验证 - 检查文件路径是否符合当前TDD阶段规则',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        filePath: {
          type: 'string',
          description: '要验证的文件路径'
        }
      },
      required: ['projectRoot', 'filePath']
    },
    handler: handleValidateFilePath
  },

  // 自动测试工具
  {
    name: 'tdd_start_auto_test',
    description: '🤖 启动自动测试 - 监听文件变更并智能运行测试',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleStartAutoTest
  },

  {
    name: 'tdd_stop_auto_test',
    description: '⏹️ 停止自动测试 - 停止文件监听和测试运行',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleStopAutoTest
  },

  {
    name: 'tdd_trigger_test',
    description: '▶️ 手动测试 - 立即触发测试运行',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleTriggerTest
  },

  {
    name: 'tdd_get_test_result',
    description: '📊 测试结果 - 获取最近的测试执行结果和历史',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetTestResult
  },

  {
    name: 'tdd_get_test_suggestions',
    description: '💡 测试建议 - 基于测试结果获取TDD阶段推进建议',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetTestSuggestions
  },

  {
    name: 'tdd_auto_test_status',
    description: '🔍 自动测试状态 - 查看自动测试监听和执行状态',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetAutoTestStatus
  },

  // 状态管理工具
  {
    name: 'tdd_enhanced_status',
    description: '📊 增强状态 - 获取详细的TDD状态、进度和上下文信息',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetEnhancedStatus
  },

  {
    name: 'tdd_status_dashboard',
    description: '📈 状态仪表盘 - 获取全面的项目TDD仪表盘视图',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetStatusDashboard
  },

  {
    name: 'tdd_context_tips',
    description: '💡 上下文提示 - 获取基于当前状态的智能提示和建议',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetContextTips
  },

  {
    name: 'tdd_project_health',
    description: '🏥 项目健康 - 评估项目TDD实践的健康度和质量',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetProjectHealth
  },

  {
    name: 'tdd_progress_report',
    description: '📈 进度报告 - 获取详细的TDD开发进度和效率报告',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetProgressReport
  },

  // 零配置初始化工具
  {
    name: 'tdd_auto_init_project',
    description: '🚀 零配置初始化 - 自动检测项目并生成最佳TDD配置',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleAutoInitProject
  },

  {
    name: 'tdd_detect_project',
    description: '🔍 项目检测 - 智能识别项目类型、框架和构建工具',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleDetectProject
  },

  {
    name: 'tdd_config_suggestions',
    description: '💡 配置建议 - 生成个性化的项目配置建议和优化方案',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGenerateConfigSuggestions
  },

  {
    name: 'tdd_apply_config',
    description: '⚙️ 应用配置 - 应用推荐的项目配置和目录结构',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        configOptions: {
          type: 'object',
          description: '自定义配置选项',
          properties: {
            commands: {
              type: 'object',
              description: '自定义命令配置'
            },
            patterns: {
              type: 'object', 
              description: '自定义文件模式配置'
            }
          }
        }
      },
      required: ['projectRoot']
    },
    handler: handleApplyRecommendedConfig
  },

  {
    name: 'tdd_validate_config',
    description: '✅ 验证配置 - 检查项目配置有效性并给出改进建议',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleValidateProjectConfig
  },

  {
    name: 'tdd_init_status',
    description: '📊 初始化状态 - 检查项目初始化完成度和就绪状态',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        }
      },
      required: ['projectRoot']
    },
    handler: handleGetInitStatus
  }
];

/**
 * 注册所有MCP工具
 */
export async function registerTools(server, sessionManager) {
  logger.info('🔧 注册MCP工具...');
  
  // 列出所有工具
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOL_DEFINITIONS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });
  
  // 处理工具调用
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // 查找工具定义
    const toolDef = TOOL_DEFINITIONS.find(tool => tool.name === name);
    if (!toolDef) {
      throw new Error(`未知的工具: ${name}`);
    }
    
    try {
      logger.info(`🔨 调用工具: ${name}`);
      logger.debug(`参数: ${JSON.stringify(args, null, 2)}`);
      
      // 调用处理器
      const result = await toolDef.handler(args, sessionManager);
      
      logger.info(`✅ 工具 ${name} 执行成功`);
      return result;
      
    } catch (error) {
      logger.error(`❌ 工具 ${name} 执行失败:`, error);
      throw error;
    }
  });
  
  logger.info(`✅ 已注册 ${TOOL_DEFINITIONS.length} 个MCP工具`);
}