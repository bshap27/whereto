import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import crypto from 'crypto'
import { USER_ERRORS, AUTH_ERRORS, VALIDATION_ERRORS } from '@/constants/response_messages'

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

export interface ResetTokenData {
  resetToken: string
  resetTokenExpiry: Date
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    // Validate required fields
    if (!userData.name || !userData.email || !userData.password) {
      throw new Error(USER_ERRORS.REQUIRED_FIELDS_MISSING)
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await this.findUserByEmail(userData.email)
    if (existingUser) {
      throw new Error(USER_ERRORS.USER_ALREADY_EXISTS)
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
        throw new Error(USER_ERRORS.EMAIL_ALREADY_TAKEN)
      }
    }

    const user = await User.findOneAndUpdate(
      { email },
      updates,
      { new: true }
    ).select('-password')

    if (!user) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND)
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    }
  }

  async generateResetToken(email: string): Promise<ResetTokenData> {
    await connectDB()
    
    const user = await this.findUserByEmail(email)
    if (!user) {
      throw new Error(AUTH_ERRORS.USER_NOT_FOUND)
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Hash the token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Save the hashed token and expiry to the user
    user.resetToken = hashedToken
    user.resetTokenExpiry = resetTokenExpiry
    await user.save()

    return {
      resetToken,
      resetTokenExpiry
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await connectDB()

    if (newPassword.length < 6) {
      throw new Error(VALIDATION_ERRORS.PASSWORD_TOO_SHORT)
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    })

    if (!user) {
      throw new Error(AUTH_ERRORS.INVALID_RESET_TOKEN)
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password and clear reset token
    user.password = hashedPassword
    user.resetToken = undefined
    user.resetTokenExpiry = undefined
    await user.save()
  }

  async clearResetToken(email: string): Promise<void> {
    await connectDB()
    
    const user = await this.findUserByEmail(email)
    if (user) {
      user.resetToken = undefined
      user.resetTokenExpiry = undefined
      await user.save()
    }
  }
} 