import { AppError } from "@/lib/errors/AppError";

/**
 * Error logging configuration
 */
interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: any;
}

/**
 * Log error with full details internally
 * Never expose these details to the client
 *
 * @param error - Error object to log
 * @param context - Additional context (request info, user ID, etc.)
 */
export function logError(error: unknown, context?: LogContext): void {
  const timestamp = new Date().toISOString();

  // Build comprehensive error log
  const errorLog = {
    timestamp,
    environment: process.env.NODE_ENV,
    context,
    error: buildErrorDetails(error),
  };

  // In production: send to monitoring service (Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with monitoring service
    // Example: Sentry.captureException(error, { contexts: { custom: errorLog } });
    console.error(JSON.stringify(errorLog));
  } else {
    // In development: detailed console output
    console.error("\n❌ Error occurred:");
    console.error("━".repeat(80));
    console.error(`Time: ${timestamp}`);
    if (context?.userId) console.error(`User: ${context.userId}`);
    if (context?.path) console.error(`Path: ${context.method} ${context.path}`);
    console.error("━".repeat(80));

    if (error instanceof AppError) {
      console.error(`Code: ${error.code}`);
      console.error(`Message: ${error.message}`);
      console.error(`Status: ${error.statusCode}`);
      if (error.action) console.error(`Action: ${error.action}`);
      if (error.metadata) {
        console.error("Metadata:", JSON.stringify(error.metadata, null, 2));
      }
    } else if (error instanceof Error) {
      console.error(`Type: ${error.name}`);
      console.error(`Message: ${error.message}`);
    } else {
      console.error("Unknown error:", error);
    }

    // Always log stack trace in development
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    console.error("━".repeat(80) + "\n");
  }
}

/**
 * Build detailed error information for logging
 */
function buildErrorDetails(error: unknown): Record<string, any> {
  if (error instanceof AppError) {
    return error.toLogFormat();
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    type: typeof error,
    value: String(error),
  };
}

/**
 * Log info message (non-error logging)
 */
export function logInfo(message: string, data?: Record<string, any>): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

/**
 * Log warning message
 */
export function logWarning(message: string, data?: Record<string, any>): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}
