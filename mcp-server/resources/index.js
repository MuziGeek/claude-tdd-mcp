import { createLogger, LogLevel } from '../utils/logger.js';
import { getProjectProfiles } from './project-profiles.js';
import { getTDDTemplates } from './tdd-templates.js';
import { getAnalysisCache } from './analysis-cache.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const logger = createLogger('ResourceRegistry', LogLevel.ERROR);

/**
 * MCP资源定义
 */
const RESOURCE_DEFINITIONS = [
  {
    uri: 'tdd://profiles',
    name: 'project_profiles',
    description: '所有可用的项目配置模板',
    mimeType: 'application/json',
    handler: getProjectProfiles
  },
  
  {
    uri: 'tdd://templates',
    name: 'tdd_templates',
    description: 'TDD各阶段的代码模板',
    mimeType: 'application/json',
    handler: getTDDTemplates
  },
  
  {
    uri: 'tdd://analysis-cache',
    name: 'analysis_cache',
    description: '项目分析结果缓存',
    mimeType: 'application/json',
    handler: getAnalysisCache
  }
];

/**
 * 注册所有MCP资源
 */
export async function registerResources(server, sessionManager) {
  logger.info('📚 注册MCP资源...');
  
  // 列出所有资源
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: RESOURCE_DEFINITIONS.map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType
      }))
    };
  });
  
  // 处理资源读取
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    // 查找资源定义
    const resourceDef = RESOURCE_DEFINITIONS.find(resource => resource.uri === uri);
    if (!resourceDef) {
      throw new Error(`未知的资源: ${uri}`);
    }
    
    try {
      logger.info(`📖 读取资源: ${uri}`);
      
      // 调用处理器
      const content = await resourceDef.handler(sessionManager);
      
      logger.info(`✅ 资源 ${uri} 读取成功`);
      
      return {
        contents: [
          {
            uri: resourceDef.uri,
            mimeType: resourceDef.mimeType,
            text: JSON.stringify(content, null, 2)
          }
        ]
      };
      
    } catch (error) {
      logger.error(`❌ 资源 ${uri} 读取失败:`, error);
      throw error;
    }
  });
  
  logger.info(`✅ 已注册 ${RESOURCE_DEFINITIONS.length} 个MCP资源`);
}