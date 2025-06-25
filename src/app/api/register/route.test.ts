// Mock NextResponse before importing the route
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, options: any = {}) => {
      return new Response(JSON.stringify(data), {
        status: options.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }
  }
}))

import { POST } from './route'
import { UserService } from '@/services/userService'

// Mock the UserService
jest.mock('@/services/userService', () => ({
  UserService: jest.fn().mockImplementation(() => ({
    createUser: jest.fn()
  }))
}))

const mockUserService = UserService as jest.MockedClass<typeof UserService>

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
      
      const mockUser = {
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com'
      }

      const mockCreateUser = jest.fn().mockResolvedValue(mockUser)
      mockUserService.mockImplementation(() => ({
        createUser: mockCreateUser
      } as any))

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.message).toBe('User created successfully')
      expect(data.user).toEqual(mockUser)
      expect(mockCreateUser).toHaveBeenCalledWith(userData)
    })

    it('returns 400 when UserService throws validation error', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      const mockCreateUser = jest.fn().mockRejectedValue(new Error('Please provide all required fields'))
      mockUserService.mockImplementation(() => ({
        createUser: mockCreateUser
      } as any))

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Please provide all required fields')
    })

    it('returns 400 when UserService throws duplicate user error', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      const mockCreateUser = jest.fn().mockRejectedValue(new Error('User already exists'))
      mockUserService.mockImplementation(() => ({
        createUser: mockCreateUser
      } as any))

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('User already exists')
    })

    it('returns 500 when UserService throws unexpected error', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      const mockCreateUser = jest.fn().mockRejectedValue(new Error('Database connection failed'))
      mockUserService.mockImplementation(() => ({
        createUser: mockCreateUser
      } as any))

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Error creating user')
    })

    it('returns 500 when UserService throws non-Error object', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      }

      const mockCreateUser = jest.fn().mockRejectedValue('String error')
      mockUserService.mockImplementation(() => ({
        createUser: mockCreateUser
      } as any))

      // Act
      const request = createRequest(userData)
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Error creating user')
    })
  })
}) 