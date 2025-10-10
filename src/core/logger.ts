/**
 * Simple logger for imgflo
 */
export class Logger {
  constructor(private verbose: boolean = false) {}

  info(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(`[imgflo] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[imgflo] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[imgflo] ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.debug(`[imgflo] ${message}`, ...args);
    }
  }
}
