// utils/error-handler.js
// Centralized error handling system

export function handleError(error, context) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] Error: ${message}`);

  // Optional: Log stack trace in development
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
}

export function handleWarning(message, context) {
  console.warn(`[${context}] Warning: ${message}`);
}

export function handleInfo(message, context) {
  console.info(`[${context}] ${message}`);
}
