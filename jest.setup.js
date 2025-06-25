// Import whatwg-fetch to provide proper Fetch API for Jest + jsdom
require('whatwg-fetch')

// Mock NextResponse
global.NextResponse = {
  json: (data, options = {}) => {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  }
};

// Suppress console.error during tests
const originalError = console.error;
console.error = (...args) => {
  // Only suppress specific error messages that are expected during tests
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('Registration error:') ||
    message.includes('Please provide all required fields') ||
    message.includes('User already exists') ||
    message.includes('Database connection failed') ||
    message.includes('String error')
  )) {
    return; // Suppress these expected test errors
  }
  // Allow other console.error messages to pass through
  originalError.apply(console, args);
}; 
