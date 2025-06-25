jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue(undefined),
  })),
}))

// Mock NextResponse before importing the route
jest.mock('next/server')

import { POST } from './route'
import { NextRequest } from 'next/server'
import { UserService } from '@/services/userService'
import { sendPasswordResetEmail } from '@/lib/email'
import { USER_ERRORS, SERVICE_ERRORS, API_SUCCESS_MESSAGES } from '@/constants/response_messages'

// Mock the UserService
jest.mock('@/services/userService')

// Mock email service
jest.mock('@/lib/email')

const mockUserService = UserService as jest.MockedClass<typeof UserService>
const mockSendPasswordResetEmail = sendPasswordResetEmail as jest.MockedFunction<typeof sendPasswordResetEmail>

describe('/api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('sends password reset email successfully when user exists', async () => {
      // Arrange
      const email = 'test@example.com'
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }

      // Mock UserService.findUserByEmail - user exists
      ;(mockUserService.prototype.findUserByEmail as jest.Mock).mockResolvedValue(mockUser)

      // Mock UserService.generateResetToken
      ;(mockUserService.prototype.generateResetToken as jest.Mock).mockResolvedValue({
        resetToken: 'reset-token-123'
      })

      // Mock email sending
      ;(mockSendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined)

      // Act
      const request = createRequest({ email })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe(API_SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT)
      expect(mockUserService.prototype.findUserByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockUserService.prototype.generateResetToken).toHaveBeenCalledWith('test@example.com')
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('/auth/reset-password?token=')
      )
    })

    it('returns success message when user does not exist (security)', async () => {
      // Arrange
      const email = 'nonexistent@example.com'

      // Mock UserService.findUserByEmail - user does not exist
      ;(mockUserService.prototype.findUserByEmail as jest.Mock).mockResolvedValue(null)

      // Act
      const request = createRequest({ email })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.message).toBe(API_SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT)
      expect(mockUserService.prototype.findUserByEmail).toHaveBeenCalledWith('nonexistent@example.com')
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('returns 400 when email is missing', async () => {
      // Arrange
      const requestData = {}

      // Act
      const request = createRequest(requestData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.EMAIL_REQUIRED)
      expect(mockUserService.prototype.findUserByEmail).not.toHaveBeenCalled()
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('returns 400 when email is empty string', async () => {
      // Arrange
      const requestData = { email: '' }

      // Act
      const request = createRequest(requestData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.EMAIL_REQUIRED)
      expect(mockUserService.prototype.findUserByEmail).not.toHaveBeenCalled()
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('returns 500 when email sending fails', async () => {
      // Arrange
      const email = 'test@example.com'
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User'
      }

      // Mock UserService.findUserByEmail - user exists
      ;(mockUserService.prototype.findUserByEmail as jest.Mock).mockResolvedValue(mockUser)

      // Mock UserService.generateResetToken
      ;(mockUserService.prototype.generateResetToken as jest.Mock).mockResolvedValue({
        resetToken: 'reset-token-123'
      })

      // Mock UserService.clearResetToken
      ;(mockUserService.prototype.clearResetToken as jest.Mock).mockResolvedValue(undefined)

      // Mock email sending to fail
      ;(mockSendPasswordResetEmail as jest.Mock).mockRejectedValue(new Error('Email service unavailable'))

      // Act
      const request = createRequest({ email })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.EMAIL_SENDING_FAILED)
      expect(mockUserService.prototype.findUserByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockUserService.prototype.generateResetToken).toHaveBeenCalledWith('test@example.com')
      expect(mockSendPasswordResetEmail).toHaveBeenCalled()
      expect(mockUserService.prototype.clearResetToken).toHaveBeenCalledWith('test@example.com')
    })

    it('returns 500 when UserService throws error', async () => {
      // Arrange
      const email = 'test@example.com'

      // Mock UserService.findUserByEmail to throw error
      ;(mockUserService.prototype.findUserByEmail as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      // Act
      const request = createRequest({ email })
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.INTERNAL_SERVER_ERROR)
    })
  })
}) 