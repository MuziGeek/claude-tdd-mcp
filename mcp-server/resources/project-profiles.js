import path from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ProjectProfiles');

/**
 * 获取项目配置模板资源
 */
export async function getProjectProfiles(sessionManager) {
  logger.info('📝 获取项目配置模板资源');
  
  try {
    // 动态导入现有的核心模块
    const { default: ProfileTemplateSystem } = await import('../../core/profile/profile-template-system.js');
    
    const templateSystem = new ProfileTemplateSystem();
    
    // 初始化模板系统
    const scaffoldPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
    await templateSystem.initialize(scaffoldPath);
    
    // 获取所有配置模板
    const profiles = templateSystem.getAllProfiles();
    
    // 按层级分组
    const layers = {
      base: [],
      frameworks: [],
      custom: []
    };
    
    profiles.forEach(profile => {
      layers[profile.layer].push({
        name: profile.name,
        displayName: profile.displayName,
        language: profile.language,
        description: profile.description,
        layer: profile.layer
      });
    });
    
    const result = {
      metadata: {
        totalProfiles: profiles.length,
        lastUpdated: new Date().toISOString(),
        layers: {
          base: layers.base.length,
          frameworks: layers.frameworks.length,
          custom: layers.custom.length
        }
      },
      profiles: {
        base: layers.base,
        frameworks: layers.frameworks,
        custom: layers.custom
      },
      usage: {
        description: '项目配置模板用于初始化TDD脚手架时选择合适的配置',
        examples: [
          'tdd_initialize项目时使用profile参数',
          'tdd_manage_profiles工具进行模板管理'
        ]
      }
    };
    
    logger.info(`✅ 获取到${profiles.length}个配置模板`);
    return result;
    
  } catch (error) {
    logger.error('获取项目配置模板失败:', error);
    throw error;
  }
}