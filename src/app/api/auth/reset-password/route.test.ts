// Mock NextResponse before importing the route
jest.mock('next/server')

import { POST } from './route'
import { NextRequest } from 'next/server'
import { UserService } from '@/services/userService'

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
      expect(data.message).toBe('Password has been reset successfully')
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
      expect(data.error).toBe('Token and password are required')
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
      expect(data.error).toBe('Token and password are required')
      expect(mockUserService.prototype.resetPassword).not.toHaveBeenCalled()
    })

    it('returns 400 when password is too short', async () => {
      // Arrange
      const token = 'valid-reset-token-123'
      const shortPassword = '123'

      // Mock UserService.resetPassword to throw validation error
      ;(mockUserService.prototype.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Password must be at least 6 characters long')
      )

      // Act
      const request = createRequest({ token, password: shortPassword })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 6 characters long')
      expect(mockUserService.prototype.resetPassword).toHaveBeenCalledWith('valid-reset-token-123', '123')
    })

    it('returns 400 when token is invalid or expired', async () => {
      // Arrange
      const token = 'invalid-token'
      const newPassword = 'newPassword123'

      // Mock UserService.resetPassword to throw token error
      ;(mockUserService.prototype.resetPassword as jest.Mock).mockRejectedValue(
        new Error('Invalid or expired reset token')
      )

      // Act
      const request = createRequest({ token, password: newPassword })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid or expired reset token')
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
      expect(data.error).toBe('Internal server error')
      expect(mockUserService.prototype.resetPassword).toHaveBeenCalledWith('valid-reset-token-123', 'newPassword123')
    })
  })
}) 