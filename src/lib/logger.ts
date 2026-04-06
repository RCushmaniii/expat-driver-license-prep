/**
 * Lightweight structured logger for server-side API routes.
 * Outputs JSON to stdout/stderr for Vercel's log drain.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  route: string;
  timestamp: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, route: string, message: string, meta?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    route,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const output = JSON.stringify(entry);

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export function createLogger(route: string) {
  return {
    info: (message: string, meta?: Record<string, unknown>) => emit("info", route, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => emit("warn", route, message, meta),
    error: (message: string, meta?: Record<string, unknown>) => emit("error", route, message, meta),
  };
}
