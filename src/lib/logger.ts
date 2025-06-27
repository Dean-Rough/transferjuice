/**
 * Simple logger utility
 * Can be replaced with more sophisticated logging in production
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel = "info";

  constructor(level?: LogLevel) {
    if (level) this.level = level;
    if (process.env.LOG_LEVEL) {
      this.level = process.env.LOG_LEVEL as LogLevel;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  private format(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    return `${prefix} ${message}`;
  }

  error(message: string, error?: any): void {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message, error));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog("info")) {
      console.log(this.format("info", message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog("debug")) {
      console.log(this.format("debug", message, data));
    }
  }
}

export const logger = new Logger();
