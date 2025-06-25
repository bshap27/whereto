// Global mock for MongoDB connection to prevent real database connections in unit tests
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

const { ERROR_MESSAGES } = require('./src/constants/response_messages');

// Import whatwg-fetch to provide proper Fetch API for Jest + jsdom
require('whatwg-fetch')

// Import jest-dom for DOM matchers
require('@testing-library/jest-dom')

// Suppress console.error for expected test errors
const originalError = console.error;
console.error = (...args) => {
  const message = args[0];
  const errorMessages = [
    ...Object.values(ERROR_MESSAGES),
    'Warning: ReactDOM.render is no longer supported',
    'Warning: useLayoutEffect does nothing on the server',
  ];
  if (
    typeof message === 'string' &&
    errorMessages.some(errMsg => message.includes(errMsg))
  ) {
    return;
  }
  originalError.call(console, ...args);
}; 
