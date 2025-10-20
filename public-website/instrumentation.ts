export async function register() {
  // Temporarily disabled instrumentation for development
  console.log('Instrumentation disabled for development');
}

// Export request error hook for server component error instrumentation
export async function onRequestError(error: unknown, request: { url: string; method: string }) {
  // Temporarily disabled for development
  console.log('Request error:', error, request);
}