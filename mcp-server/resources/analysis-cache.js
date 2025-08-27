import { createLogger } from '../utils/logger.js';

const logger = createLogger('AnalysisCache');

/**
 * 获取分析缓存资源
 */
export async function getAnalysisCache(sessionManager) {
  logger.info('📊 获取分析缓存资源');
  
  try {
    // 获取所有会话的分析缓存
    const sessions = sessionManager.getAllSessions();
    
    const analysisCache = {
      metadata: {
        totalProjects: sessions.length,
        lastUpdated: new Date().toISOString(),
        cacheVersion: '2.0'
      },
      projects: {},
      summary: {
        analyzed: 0,
        withRecommendations: 0,
        totalRecommendations: 0
      }
    };
    
    sessions.forEach(session => {
      if (session.analysisCache) {
        const projectKey = session.projectName || session.projectRoot;
        
        analysisCache.projects[projectKey] = {
          projectRoot: session.projectRoot,
          analyzedAt: session.analysisCache.analyzedAt,
          architecture: {
            pattern: session.analysisCache.architecture?.pattern,
            complexity: session.analysisCache.architecture?.complexity,
            modules: session.analysisCache.architecture?.modules?.length || 0
          },
          testStrategy: {
            frameworks: session.analysisCache.testStrategy?.frameworks || [],
            coverage: session.analysisCache.testStrategy?.coverage
          },
          dependencies: {
            total: session.analysisCache.dependencies?.dependencies?.length || 0,
            outdated: session.analysisCache.dependencies?.outdated?.length || 0
          },
          recommendations: session.analysisCache.recommendations || [],
          lastImport: session.analysisImport?.importedAt,
          lastComparison: session.analysisComparison?.comparedAt
        };
        
        analysisCache.summary.analyzed++;
        if (session.analysisCache.recommendations?.length > 0) {
          analysisCache.summary.withRecommendations++;
          analysisCache.summary.totalRecommendations += session.analysisCache.recommendations.length;
        }
      }
    });
    
    logger.info(`✅ 获取到${analysisCache.summary.analyzed}个项目的分析缓存`);
    return analysisCache;
    
  } catch (error) {
    logger.error('获取分析缓存失败:', error);
    throw error;
  }
}