/**
 * 日志工具
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

/**
 * 简单的日志器实现
 */
class Logger {
  constructor(name, level = LogLevel.INFO) {
    this.name = name;
    this.level = level;
    this.colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // 青色
      [LogLevel.INFO]: '\x1b[32m',  // 绿色
      [LogLevel.WARN]: '\x1b[33m',  // 黄色
      [LogLevel.ERROR]: '\x1b[31m'  // 红色
    };
    this.resetColor = '\x1b[0m';
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(LogLevel)[level];
    const color = this.colors[level];
    
    return `${color}[${timestamp}] ${this.name} ${levelName}:${this.resetColor} ${message}`;
  }

  /**
   * 输出日志
   */
  log(level, message, ...args) {
    // 在MCP环境中，所有日志都输出到stderr以避免干扰stdio通信
    if (level >= this.level) {
      const formattedMessage = this.formatMessage(level, message);
      
      // 所有日志都输出到stderr，保持stdout清洁用于MCP通信
      process.stderr.write(formattedMessage + '\n');
      if (args.length > 0) {
        process.stderr.write(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n');
      }
    }
  }

  debug(message, ...args) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message, ...args) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message, ...args) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message, ...args) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

/**
 * 创建日志器
 */
function createLogger(name, level = LogLevel.INFO) {
  return new Logger(name, level);
}

export { Logger, LogLevel, createLogger };