import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export interface CreateUserData {
  name: string
  email: string
  password: string
}

export interface UserResponse {
  id: string
  name: string
  email: string
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error('Please provide all required fields')
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email })
    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    // Create user
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
    })

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    }
  }

  async findUserByEmail(email: string) {
    await connectDB()
    return User.findOne({ email }).select('-password')
  }

  async updateUser(email: string, updates: Partial<CreateUserData>) {
    await connectDB()
    
    // Check if email is already taken by another user
    if (updates.email && updates.email !== email) {
      const existingUser = await User.findOne({ 
        $and: [
          { email: updates.email },
          { email: { $ne: email } }
        ]
      })
      
      if (existingUser) {
        throw new Error('Email is already taken')
      }
    }

    const user = await User.findOneAndUpdate(
      { email },
      updates,
      { new: true }
    ).select('-password')

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    }
  }
} 