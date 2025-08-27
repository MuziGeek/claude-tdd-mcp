import { createLogger } from '../utils/logger.js';
import { handleInitializeProject } from './initialization.js';
import { handleScanProject, handleDeepAnalyze } from './scanning.js';
import { handleValidateEnvironment } from './validation.js';
import { handleGetStatus, handleExportConfig, handleImportConfig } from './configuration.js';
import { handleExportAnalysis, handleImportAnalysis, handleCompareAnalysis, handleApplyAnalysis } from './analysis.js';
import { handleManageProfiles } from './profiles.js';
import { handleSwitchPhase, handleGetTDDStatus, handleCreateFeature, handleCompletePhase, handleValidateFilePath } from './tdd-workflow.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const logger = createLogger('ToolRegistry');

/**
 * MCP工具定义
 */
const TOOL_DEFINITIONS = [
  {
    name: 'tdd_initialize',
    description: '在指定路径初始化TDD脚手架项目',
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
    description: '扫描并分析项目结构和特性',
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
    description: '深度分析项目特性，包括架构、测试策略、依赖和代码模式',
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
    description: '验证Claude Code环境和TDD配置',
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
    description: '获取当前TDD状态和会话信息',
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
    description: '导出TDD项目配置',
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
    description: '导入TDD项目配置',
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
    description: '导出项目深度分析结果',
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
    description: '导入其他项目的分析结果',
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
    description: '比较当前项目与导入的分析结果',
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
    description: '将分析结果应用到TDD流程配置',
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
    description: '管理项目配置模板',
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
    description: '切换TDD阶段（RED/GREEN/REFACTOR）',
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
    description: '创建新的TDD特性开发流程',
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
    description: '完成当前TDD阶段',
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
    description: '验证文件路径是否符合当前TDD阶段规则',
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