import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET, PUT } from './route'
import User from '@/models/User'
import { AUTH_ERRORS, USER_ERRORS, SERVICE_ERRORS } from '@/constants/response_messages'

// Mock next-auth
jest.mock('next-auth')

// Mock User model
jest.mock('@/models/User')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockUser = User as jest.MockedClass<typeof User>

interface SessionUser {
  email?: string
}

interface Session {
  user?: SessionUser
}

interface ProfileUpdateData {
  name?: string
  email?: string
}

describe('/api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/profile', () => {
    it('returns user profile when authenticated', async () => {
      const mockUserData = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUserData)
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
    })

    it('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe(AUTH_ERRORS.NOT_AUTHENTICATED)
      expect(mockUser.findOne).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as Session)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe(AUTH_ERRORS.NOT_AUTHENTICATED)
      expect(mockUser.findOne).not.toHaveBeenCalled()
    })

    it('returns 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe(AUTH_ERRORS.USER_NOT_FOUND)
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
    })

    it('returns 500 when database throws error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.SERVER_ERROR)
    })
  })

  describe('PUT /api/profile', () => {
    const createRequest = (body: ProfileUpdateData) => {
      return new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    it('updates user profile successfully', async () => {
      const mockUserData = {
        _id: 'user123',
        name: 'Jane Doe',
        email: 'jane@example.com',
      }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      // Mock the email check - no existing user with new email
      ;(mockUser.findOne as jest.Mock).mockResolvedValueOnce(null)

      // Mock the update operation
      ;(mockUser.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      })

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 'user123',
        name: 'Jane Doe',
        email: 'jane@example.com',
      })
      expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'john@example.com' },
        { name: 'Jane Doe', email: 'jane@example.com' },
        { new: true }
      )
    })

    it('returns 401 when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe(AUTH_ERRORS.NOT_AUTHENTICATED)
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as Session)

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 400 when name is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      const request = createRequest({
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Name and email are required' })
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 400 when email is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      const request = createRequest({
        name: 'Jane Doe',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe(USER_ERRORS.NAME_AND_EMAIL_REQUIRED)
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 409 when email is already taken', async () => {
      const existingUser = { _id: 'other123', email: 'jane@example.com' }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      ;(mockUser.findOne as jest.Mock).mockResolvedValue(existingUser)

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe(USER_ERRORS.EMAIL_ALREADY_TAKEN)
      expect(mockUser.findOne).toHaveBeenCalledWith({
        $and: [
          { email: 'jane@example.com' },
          { email: { $ne: 'john@example.com' } }
        ]
      })
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('allows updating to same email', async () => {
      const mockUserData = {
        _id: 'user123',
        name: 'Jane Doe',
        email: 'john@example.com',
      }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      // Mock the email check - no other user with same email
      ;(mockUser.findOne as jest.Mock).mockResolvedValue(null)

      ;(mockUser.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      })

      const request = createRequest({
        name: 'Jane Doe',
        email: 'john@example.com', // Same email
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 'user123',
        name: 'Jane Doe',
        email: 'john@example.com',
      })
    })

    it('returns 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      // Mock the email check - no existing user with new email
      ;(mockUser.findOne as jest.Mock).mockResolvedValueOnce(null)

      // Mock the update operation - user not found
      ;(mockUser.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      })

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe(AUTH_ERRORS.USER_NOT_FOUND)
    })

    it('returns 500 when database throws error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      ;(mockUser.findOne as jest.Mock).mockResolvedValue(null)
      ;(mockUser.findOneAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      })

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.SERVER_ERROR)
    })

    it('returns 500 when request body is invalid JSON', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as Session)

      const invalidRequest = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(invalidRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe(SERVICE_ERRORS.SERVER_ERROR)
    })
  })
}) 