import User from '@/models/User'
import bcrypt from 'bcryptjs'
import { USER_ERRORS, AUTH_ERRORS } from '@/constants/response_messages'

interface Credentials {
  email?: string
  password?: string
}

export async function credentialsAuthorize(credentials: Credentials) {
  if (!credentials?.email || !credentials?.password) {
    throw new Error(USER_ERRORS.EMAIL_AND_PASSWORD_REQUIRED)
  }

  const user = await User.findOne({ email: credentials.email })

  if (!user) {
    throw new Error(AUTH_ERRORS.USER_NOT_FOUND)
  }

  const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

  if (!isPasswordValid) {
    throw new Error(AUTH_ERRORS.INVALID_PASSWORD)
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    image: user.image,
  }
} 