// Mock NextResponse before importing the route
jest.mock('next/server')

import { POST } from './route'
import { NextRequest } from 'next/server'
import { UserService } from '@/services/userService'
import { USER_ERRORS, AUTH_ERRORS, VALIDATION_ERRORS, SERVICE_ERRORS, API_SUCCESS_MESSAGES } from '@/constants/response_messages'

// Mock the UserService
jest.mock('@/services/userService')

const mockUserService = UserService as jest.MockedClass<typeof UserService>

describe('/api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('resets password successfully with valid token', async () => {
      // Arrange
      const token = 'valid-reset-token-123'
      const newPassword = 'newPassword123'

      // Mock UserService.resetPassword to succeed
      ;(mockUserService.prototype.resetPassword as jest.Mock).mockResolvedValue(undefined)

      // Act
      const request = createRequest({ token, password: newPassword })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe(API_SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS)
      expect(mockUserService.prototype.resetPassword).toHaveBeenCalledWith('valid-reset-token-123', 'newPassword123')
    })

    it('returns 400 when token is missing', async () => {
      // Arrange
      const requestData = { password: 'newPassword123' }

      // Act
      const request = createRequest(requestData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.TOKEN_AND_PASSWORD_REQUIRED)
      expect(mockUserService.prototype.resetPassword).not.toHaveBeenCalled()
    })

    it('returns 400 when password is missing', async () => {
      // Arrange
      const requestData = { token: 'valid-token' }

      // Act
      const request = createRequest(requestData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.TOKEN_AND_PASSWORD_REQUIRED)
      expect(mockUserService.prototype.resetPassword).not.toHaveBeenCalled()
    })

    it('returns 400 when password is too short', async () => {
      // Arrange
      const token = 'valid-reset-token-123'
      const shortPassword = '123'

      // Mock UserService.resetPassword to throw validation error
      ;(mockUserService.prototype.resetPassword as jest.Mock).mockRejectedValue(
        new Error(VALIDATION_ERRORS.PASSWORD_TOO_SHORT)
      )

      // Act
      const request = createRequest({ token, password: shortPassword })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(VALIDATION_ERRORS.PASSWORD_TOO_SHORT)
      expect(mockUserService.prototype.resetPassword).toHaveBeenCalledWith('valid-reset-token-123', '123')
    })

    it('returns 400 when token is invalid or expired', async () => {
      // Arrange
      const token = 'invalid-token'
      const newPassword = 'newPassword123'

      // Mock UserService.resetPassword to throw token error
      ;(mockUserService.prototype.resetPassword as jest.Mock).mockRejectedValue(
        new Error(AUTH_ERRORS.INVALID_RESET_TOKEN)
      )

      // Act
      const request = createRequest({ token, password: newPassword })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(AUTH_ERRORS.INVALID_RESET_TOKEN)
      expect(mockUserService.prototype.resetPassword).toHaveBeenCalledWith('invalid-token', 'newPassword123')
    })

    it('returns 500 when UserService throws unexpected error', async () => {
      // Arrange
      const token = 'valid-reset-token-123'
      const newPassword = 'newPassword123'

      // Mock UserService.resetPassword to throw unexpected error
      ;(mockUserService.prototype.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Unexpected database error')
      )

      // Act
      const request = createRequest({ token, password: newPassword })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.INTERNAL_SERVER_ERROR)
      expect(mockUserService.prototype.resetPassword).toHaveBeenCalledWith('valid-reset-token-123', 'newPassword123')
    })
  })
}) 