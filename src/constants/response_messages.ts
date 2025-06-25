// Authentication & Authorization Errors
export const AUTH_ERRORS = {
  NOT_AUTHENTICATED: 'Not authenticated',
  USER_NOT_FOUND: 'User not found',
  INVALID_PASSWORD: 'Invalid password',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token',
} as const

// User Registration & Profile Errors
export const USER_ERRORS = {
  REQUIRED_FIELDS_MISSING: 'Please provide all required fields',
  USER_ALREADY_EXISTS: 'User already exists',
  EMAIL_ALREADY_TAKEN: 'Email is already taken',
  NAME_AND_EMAIL_REQUIRED: 'Name and email are required',
  EMAIL_AND_PASSWORD_REQUIRED: 'Please enter an email and password',
} as const

// Database & Service Errors
export const SERVICE_ERRORS = {
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  DATABASE_CREATE_FAILED: 'Database create failed',
  HASHING_FAILED: 'Hashing failed',
  ERROR_CREATING_USER: 'Error creating user',
  SERVER_ERROR: 'Server error',
} as const

// API Response Errors
export const API_ERRORS = {
  PROFILE_FETCH_ERROR: 'Profile fetch error:',
  PROFILE_UPDATE_ERROR: 'Profile update error:',
  REGISTRATION_ERROR: 'Registration error:',
} as const

// Validation Errors
export const VALIDATION_ERRORS = {
  INVALID_EMAIL: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  INVALID_NAME: 'Name must be at least 2 characters',
} as const

export const API_SUCCESS_MESSAGES = {
  USER_CREATED_SUCCESS: 'User created successfully',
} as const

// All error messages combined for easy access
export const ERROR_MESSAGES = {
  ...AUTH_ERRORS,
  ...USER_ERRORS,
  ...SERVICE_ERRORS,
  ...API_ERRORS,
  ...VALIDATION_ERRORS,
} as const

// Type for all error message values
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES] 