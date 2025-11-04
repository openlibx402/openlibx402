/**
 * Simple logger utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;

  constructor(prefix: string = 'APP') {
    this.prefix = prefix;
  }

  private format(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.prefix}] ${message}${dataStr}`;
  }

  debug(message: string, data?: unknown): void {
    console.debug(this.format('debug', message, data));
  }

  info(message: string, data?: unknown): void {
    console.info(this.format('info', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.format('warn', message, data));
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      console.error(this.format('error', message, { message: error.message, stack: error.stack }));
    } else {
      console.error(this.format('error', message, error));
    }
  }
}

export const logger = new Logger('RAGBOT');
