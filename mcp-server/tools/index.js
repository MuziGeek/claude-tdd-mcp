import { createLogger, LogLevel } from '../utils/logger.js';
import { 
  initProject, 
  switchPhase, 
  runTest, 
  getStatus, 
  routeCommand 
} from './core.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const logger = createLogger('ToolRegistry', LogLevel.INFO);

/**
 * 极简MCP工具定义 - 仅保留5个核心工具
 * MCP只做必须的事，让Claude做擅长的事
 */
const TOOL_DEFINITIONS = [
  {
    name: 'tdd_init_project',
    description: '🚀 初始化TDD项目 - 检测环境并设置完整的TDD开发环境',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        profile: {
          type: 'string',
          description: '项目类型 (javascript, java, python)',
          enum: ['javascript', 'java', 'python']
        },
        force: {
          type: 'boolean',
          description: '强制覆盖现有配置',
          default: false
        }
      },
      required: ['projectRoot']
    },
    handler: async (args, sessionManager) => await initProject(args)
  },

  {
    name: 'tdd_switch_phase',
    description: '🔄 切换TDD阶段 - RED/GREEN/REFACTOR/READY状态切换',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        phase: {
          type: 'string',
          enum: ['RED', 'GREEN', 'REFACTOR', 'READY'],
          description: 'TDD阶段'
        },
        featureId: {
          type: 'string',
          description: '特性ID（可选）'
        }
      },
      required: ['projectRoot', 'phase']
    },
    handler: async (args, sessionManager) => await switchPhase(args)
  },

  {
    name: 'tdd_run_test',
    description: '▶️ 执行测试 - 运行测试并提供TDD导向的反馈',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        testFile: {
          type: 'string',
          description: '指定测试文件（可选，默认运行所有测试）'
        },
        watch: {
          type: 'boolean',
          description: '是否启动监听模式',
          default: false
        }
      },
      required: ['projectRoot']
    },
    handler: async (args, sessionManager) => await runTest(args)
  },

  {
    name: 'tdd_get_status',
    description: '📊 查询状态 - 获取当前TDD状态、配置和项目信息',
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
    handler: async (args, sessionManager) => await getStatus(args)
  },

  {
    name: 'tdd_smart_command',
    description: '🤖 智能命令路由 - 处理自然语言输入和命令别名',
    inputSchema: {
      type: 'object',
      properties: {
        projectRoot: {
          type: 'string',
          description: '项目根目录的绝对路径'
        },
        input: {
          type: 'string',
          description: '自然语言输入或命令别名，如: "初始化", "red", "测试", "状态"'
        }
      },
      required: ['projectRoot', 'input']
    },
    handler: async (args, sessionManager) => await routeCommand(args)
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