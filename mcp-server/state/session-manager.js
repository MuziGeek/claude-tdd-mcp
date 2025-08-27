import fs from 'fs-extra';
import path from 'path';
import { createLogger, LogLevel } from '../utils/logger.js';

const logger = createLogger('SessionManager', LogLevel.INFO);

/**
 * 会话管理器
 * 管理项目级别的TDD状态和会话数据
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.cacheDir = process.env.TDD_CACHE_DIR || path.join(process.env.HOME || process.cwd(), '.cache/tdd-scaffold');
    this.initialized = false;
  }

  /**
   * 初始化会话管理器
   */
  async initialize() {
    try {
      await fs.ensureDir(this.cacheDir);
      await this.loadExistingSessions();
      this.initialized = true;
      logger.info('✅ 会话管理器初始化完成');
    } catch (error) {
      logger.error('❌ 会话管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载现有会话
   */
  async loadExistingSessions() {
    const sessionFiles = await fs.readdir(this.cacheDir).catch(() => []);
    
    for (const file of sessionFiles) {
      if (file.endsWith('.session.json')) {
        try {
          const sessionPath = path.join(this.cacheDir, file);
          const sessionData = await fs.readJson(sessionPath);
          const projectRoot = sessionData.projectRoot;
          
          if (projectRoot) {
            this.sessions.set(projectRoot, sessionData);
            logger.debug(`加载会话: ${projectRoot}`);
          }
        } catch (error) {
          logger.warn(`加载会话文件失败: ${file}`, error);
        }
      }
    }
    
    logger.info(`📚 已加载 ${this.sessions.size} 个会话`);
  }

  /**
   * 获取或创建项目会话
   */
  async getOrCreateSession(projectRoot) {
    if (!this.initialized) {
      await this.initialize();
    }

    const normalizedPath = path.resolve(projectRoot);
    
    if (!this.sessions.has(normalizedPath)) {
      const session = {
        projectRoot: normalizedPath,
        projectName: path.basename(normalizedPath),
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        tddState: {
          currentFeature: null,
          currentPhase: null,
          activeTask: null,
          history: []
        },
        projectInfo: null,
        analysisCache: null
      };
      
      this.sessions.set(normalizedPath, session);
      await this.saveSession(normalizedPath);
      
      logger.info(`🆕 创建新会话: ${normalizedPath}`);
    } else {
      // 更新最后活跃时间
      const session = this.sessions.get(normalizedPath);
      session.lastActiveAt = new Date().toISOString();
      await this.saveSession(normalizedPath);
    }
    
    return this.sessions.get(normalizedPath);
  }

  /**
   * 更新会话数据
   */
  async updateSession(projectRoot, updates) {
    const session = await this.getOrCreateSession(projectRoot);
    
    // 深度合并更新
    this.deepMerge(session, updates);
    session.lastActiveAt = new Date().toISOString();
    
    await this.saveSession(projectRoot);
    
    logger.debug(`🔄 更新会话: ${projectRoot}`);
    return session;
  }

  /**
   * 深度合并对象
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  /**
   * 保存会话到文件
   */
  async saveSession(projectRoot) {
    const session = this.sessions.get(path.resolve(projectRoot));
    if (!session) return;

    const sessionFile = path.join(
      this.cacheDir, 
      `${path.basename(projectRoot)}.session.json`
    );
    
    try {
      await fs.writeJson(sessionFile, session, { spaces: 2 });
    } catch (error) {
      logger.error(`保存会话失败: ${projectRoot}`, error);
    }
  }

  /**
   * 保存所有会话
   */
  async saveAllSessions() {
    const savePromises = Array.from(this.sessions.keys()).map(projectRoot => 
      this.saveSession(projectRoot)
    );
    
    await Promise.all(savePromises);
    logger.info('💾 所有会话已保存');
  }

  /**
   * 删除会话
   */
  async deleteSession(projectRoot) {
    const normalizedPath = path.resolve(projectRoot);
    
    if (this.sessions.has(normalizedPath)) {
      this.sessions.delete(normalizedPath);
      
      const sessionFile = path.join(
        this.cacheDir, 
        `${path.basename(projectRoot)}.session.json`
      );
      
      await fs.remove(sessionFile).catch(() => {});
      
      logger.info(`🗑️ 删除会话: ${normalizedPath}`);
    }
  }

  /**
   * 获取活跃会话数量
   */
  getActiveSessionCount() {
    return this.sessions.size;
  }

  /**
   * 获取所有会话列表
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * 清理过期会话
   */
  async cleanExpiredSessions(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7天
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [projectRoot, session] of this.sessions) {
      const lastActive = new Date(session.lastActiveAt).getTime();
      if (now - lastActive > maxAge) {
        expiredSessions.push(projectRoot);
      }
    }
    
    for (const projectRoot of expiredSessions) {
      await this.deleteSession(projectRoot);
    }
    
    if (expiredSessions.length > 0) {
      logger.info(`🧹 清理了 ${expiredSessions.length} 个过期会话`);
    }
  }
}

export { SessionManager };