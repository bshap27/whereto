import { credentialsAuthorize } from './credentialsAuthorize'
import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { USER_ERRORS, AUTH_ERRORS } from '@/constants/response_messages'

// Mock the User model
jest.mock('@/models/User')

// Mock bcrypt
jest.mock('bcryptjs')

const mockUser = User as jest.MockedClass<typeof User>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('credentialsAuthorize', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('authenticates user successfully with valid credentials', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    }
    const mockUserDoc = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123',
      image: 'https://example.com/avatar.jpg'
    }

    // Mock User.findOne - user exists
    ;(mockUser.findOne as jest.Mock).mockResolvedValue(mockUserDoc)

    // Mock bcrypt compare - password is valid
    ;(mockBcrypt.compare as jest.Mock).mockResolvedValue(true)

    // Act
    const result = await credentialsAuthorize(credentials)

    // Assert
    expect(result).toEqual({
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    })

    expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123')
  })

  it('throws error when email is missing', async () => {
    // Arrange
    const credentials = {
      password: 'password123'
      // email missing
    }

    // Act & Assert
    await expect(credentialsAuthorize(credentials)).rejects.toThrow(USER_ERRORS.EMAIL_AND_PASSWORD_REQUIRED)
    expect(mockUser.findOne).not.toHaveBeenCalled()
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('throws error when password is missing', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com'
      // password missing
    }

    // Act & Assert
    await expect(credentialsAuthorize(credentials)).rejects.toThrow(USER_ERRORS.EMAIL_AND_PASSWORD_REQUIRED)
    expect(mockUser.findOne).not.toHaveBeenCalled()
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('throws error when user not found', async () => {
    // Arrange
    const credentials = {
      email: 'nonexistent@example.com',
      password: 'password123'
    }

    // Mock User.findOne - user does not exist
    ;(mockUser.findOne as jest.Mock).mockResolvedValue(null)

    // Act & Assert
    await expect(credentialsAuthorize(credentials)).rejects.toThrow(AUTH_ERRORS.USER_NOT_FOUND)
    expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' })
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('throws error when password is invalid', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'wrongpassword'
    }
    const mockUserDoc = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123'
    }

    // Mock User.findOne - user exists
    ;(mockUser.findOne as jest.Mock).mockResolvedValue(mockUserDoc)

    // Mock bcrypt compare - password is invalid
    ;(mockBcrypt.compare as jest.Mock).mockResolvedValue(false)

    // Act & Assert
    await expect(credentialsAuthorize(credentials)).rejects.toThrow(AUTH_ERRORS.INVALID_PASSWORD)
    expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword123')
  })

  it('throws error when database connection fails', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    // Mock User.findOne to throw error
    ;(mockUser.findOne as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    // Act & Assert
    await expect(credentialsAuthorize(credentials)).rejects.toThrow('Database connection failed')
    expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    expect(mockBcrypt.compare).not.toHaveBeenCalled()
  })

  it('throws error when bcrypt compare fails', async () => {
    // Arrange
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    }
    const mockUserDoc = {
      _id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123'
    }

    // Mock User.findOne - user exists
    ;(mockUser.findOne as jest.Mock).mockResolvedValue(mockUserDoc)

    // Mock bcrypt compare to throw error
    ;(mockBcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'))

    // Act & Assert
    await expect(credentialsAuthorize(credentials)).rejects.toThrow('Bcrypt error')
    expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
    expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123')
  })
}) 