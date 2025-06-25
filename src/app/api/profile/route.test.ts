import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { GET, PUT } from './route'
import User from '@/models/User'

// Mock next-auth
jest.mock('next-auth')

// Mock User model
jest.mock('@/models/User')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockUser = User as jest.MockedClass<typeof User>

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
      } as any)

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
      expect(data).toEqual({ error: 'Not authenticated' })
      expect(mockUser.findOne).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Not authenticated' })
      expect(mockUser.findOne).not.toHaveBeenCalled()
    })

    it('returns 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as any)

      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'User not found' })
      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
    })

    it('returns 500 when database throws error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as any)

      ;(mockUser.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Server error' })
    })
  })

  describe('PUT /api/profile', () => {
    const createRequest = (body: any) => {
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
      } as any)

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
      expect(data).toEqual(mockUserData)
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
      expect(data).toEqual({ error: 'Not authenticated' })
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 401 when session has no user email', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {},
      } as any)

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
      } as any)

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
      } as any)

      const request = createRequest({
        name: 'Jane Doe',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Name and email are required' })
      expect(mockUser.findOne).not.toHaveBeenCalled()
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 400 when email is already taken', async () => {
      const existingUser = { _id: 'other123', email: 'jane@example.com' }

      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as any)

      // Mock the email check - existing user with new email
      ;(mockUser.findOne as jest.Mock).mockResolvedValueOnce(existingUser)

      const request = createRequest({
        name: 'Jane Doe',
        email: 'jane@example.com',
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({ error: 'Email is already taken' })
      expect(mockUser.findOne).toHaveBeenCalledWith({
        $and: [
          { email: 'jane@example.com' },
          { email: { $ne: 'john@example.com' } }
        ]
      })
      expect(mockUser.findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('returns 404 when user not found', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as any)

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
      expect(data).toEqual({ error: 'User not found' })
    })

    it('returns 500 when database throws error', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { email: 'john@example.com' },
      } as any)

      // Mock the email check - no existing user with new email
      ;(mockUser.findOne as jest.Mock).mockResolvedValueOnce(null)

      // Mock the update operation - database error
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
      expect(data).toEqual({ error: 'Server error' })
    })
  })
}) 