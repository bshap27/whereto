// Mock NextResponse before importing the route
jest.mock('next/server')

import { POST } from './route'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { USER_ERRORS, SERVICE_ERRORS, API_ERRORS } from '@/constants/errors'

// Mock the User model
jest.mock('@/models/User')

// Mock bcrypt
jest.mock('bcryptjs')

const mockUser = User as jest.MockedClass<typeof User>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('/api/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any): Request => {
    return new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('creates user successfully with valid data', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }
      
      const mockUserDoc = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123'
      }

      // Mock bcrypt hash
      ;(mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123')

      // Mock User.findOne - no existing user
      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      })

      // Mock User.create
      ;(mockUser.create as jest.Mock).mockResolvedValue(mockUserDoc)

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.message).toBe(API_ERRORS.USER_CREATED_SUCCESS)
      expect(data.user).toEqual({
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com'
      })
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10)
      expect(mockUser.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123'
      })
    })

    it('returns 400 when required fields are missing', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
        // password missing
      }

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.REQUIRED_FIELDS_MISSING)
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.create).not.toHaveBeenCalled()
    })

    it('returns 400 when user already exists', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      const existingUser = {
        _id: 'existing123',
        email: 'john@example.com'
      }

      // Mock User.findOne - existing user found
      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(existingUser)
      })

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.USER_ALREADY_EXISTS)
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
      expect(mockUser.create).not.toHaveBeenCalled()
    })

    it('returns 500 when database throws error', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      // Mock User.findOne to throw error
      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error(SERVICE_ERRORS.DATABASE_CONNECTION_FAILED))
      })

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.SERVER_ERROR)
    })

    it('returns 500 when bcrypt throws error', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      // Mock User.findOne - no existing user
      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      })

      // Mock bcrypt.hash to throw error
      ;(mockBcrypt.hash as jest.Mock).mockRejectedValue(new Error(SERVICE_ERRORS.HASHING_FAILED))

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.SERVER_ERROR)
    })
  })
}) 