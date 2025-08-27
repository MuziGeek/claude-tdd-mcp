import path from 'path';
import fs from 'fs-extra';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Initialization');

/**
 * 简化的项目初始化器
 */
class SimpleProjectInitializer {
  async initialize(projectRoot, options = {}) {
    const { force = false, skipTaskMaster = false, profile = 'auto-detected' } = options;
    
    // 检测项目类型
    const detectedProfile = await this.detectProjectType(projectRoot);
    const finalProfile = profile === 'auto-detected' ? detectedProfile : profile;
    
    // 创建.claude目录结构
    const claudeDir = path.join(projectRoot, '.claude');
    await fs.ensureDir(claudeDir);
    
    // 创建基本配置文件
    const configFiles = await this.createConfigFiles(claudeDir, finalProfile, force);
    
    // 创建TDD会话文件
    const sessionFile = path.join(projectRoot, '.tdd-session.json');
    const sessionData = {
      id: `session_${Date.now()}`,
      projectPath: projectRoot,
      projectType: finalProfile,
      currentPhase: null,
      features: {},
      createdAt: new Date().toISOString()
    };
    
    await fs.writeJson(sessionFile, sessionData, { spaces: 2 });
    
    return {
      profile: finalProfile,
      filesCreated: [
        ...configFiles,
        sessionFile
      ],
      taskmasterIntegrated: false, // 简化版不集成Task Master
      sessionId: sessionData.id
    };
  }
  
  async detectProjectType(projectRoot) {
    const pomXml = path.join(projectRoot, 'pom.xml');
    const packageJson = path.join(projectRoot, 'package.json');
    const requirementsTxt = path.join(projectRoot, 'requirements.txt');
    
    if (await fs.pathExists(pomXml)) {
      const content = await fs.readFile(pomXml, 'utf8');
      if (content.includes('spring-boot')) {
        return 'java-spring-boot';
      }
      return 'java';
    }
    
    if (await fs.pathExists(packageJson)) {
      const pkg = await fs.readJson(packageJson);
      if (pkg.dependencies && (pkg.dependencies.express || pkg.dependencies['@nestjs/core'])) {
        return 'node-express';
      }
      return 'nodejs';
    }
    
    if (await fs.pathExists(requirementsTxt)) {
      const content = await fs.readFile(requirementsTxt, 'utf8');
      if (content.includes('Django')) {
        return 'python-django';
      }
      return 'python';
    }
    
    return 'generic';
  }
  
  async createConfigFiles(claudeDir, profile, force) {
    const files = [];
    
    // 创建基本的CLAUDE.md文件
    const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
    if (force || !await fs.pathExists(claudeMdPath)) {
      const claudeMdContent = this.generateClaudeMdContent(profile);
      await fs.writeFile(claudeMdPath, claudeMdContent);
      files.push(claudeMdPath);
    }
    
    // 创建settings.json文件
    const settingsPath = path.join(claudeDir, 'settings.json');
    if (force || !await fs.pathExists(settingsPath)) {
      const settingsContent = this.generateSettingsContent(profile);
      await fs.writeJson(settingsPath, settingsContent, { spaces: 2 });
      files.push(settingsPath);
    }
    
    return files;
  }
  
  generateClaudeMdContent(profile) {
    return `# ${profile.toUpperCase()} Project TDD Configuration

This project has been initialized with TDD Scaffold for ${profile}.

## Commands
- \`tdd_scan_project\` - Analyze project structure
- \`tdd_switch_phase\` - Switch TDD phase (RED/GREEN/REFACTOR)
- \`tdd_get_status\` - Get current TDD status
- \`tdd_validate_file_path\` - Validate file operations

## TDD Phases
- **RED**: Write failing tests only
- **GREEN**: Write minimal code to pass tests
- **REFACTOR**: Improve code quality without changing behavior

## Best Practices
1. Always start with RED phase
2. Write minimal code in GREEN phase
3. Refactor with confidence after tests pass
4. Commit frequently at each phase completion
`;
  }
  
  generateSettingsContent(profile) {
    return {
      "name": `TDD Scaffold - ${profile}`,
      "version": "2.0.0",
      "tdd": {
        "enabled": true,
        "profile": profile,
        "autoPhaseValidation": true,
        "filePathRestrictions": true
      },
      "hooks": {
        "preToolUse": true,
        "postToolUse": true
      }
    };
  }
}

/**
 * 处理项目初始化
 */
export async function handleInitializeProject(args, sessionManager) {
  const { projectRoot, profile, force = false, skipTaskMaster = false } = args;
  
  logger.info(`🚀 初始化TDD项目: ${projectRoot}`);
  
  try {
    const initializer = new SimpleProjectInitializer();
    
    // 执行初始化
    const result = await initializer.initialize(projectRoot, {
      force,
      skipTaskMaster,
      profile
    });
    
    // 创建或获取会话
    const session = await sessionManager.getOrCreateSession(projectRoot);
    await sessionManager.updateSession(projectRoot, {
      projectType: result.profile,
      initialized: true,
      initializedAt: new Date().toISOString()
    });
    
    logger.info(`✅ 项目初始化完成: ${projectRoot}`);
    
    return {
      success: true,
      data: {
        sessionId: session.projectRoot, // SessionManager使用projectRoot作为ID
        projectRoot,
        profile: result.profile,
        filesCreated: result.filesCreated,
        taskmasterIntegrated: result.taskmasterIntegrated,
        claudeAssetsPath: path.join(projectRoot, '.claude'),
        recommendations: [
          '确保项目在Claude Code环境中打开',
          '使用tdd_get_status查看当前状态',
          '使用tdd_scan_project分析项目结构'
        ]
      },
      message: 'TDD脚手架初始化成功'
    };
    
  } catch (error) {
    logger.error('初始化失败:', error);
    
    return {
      success: false,
      error: {
        code: 'INITIALIZATION_FAILED',
        message: error.message,
        details: error.stack
      }
    };
  }
}