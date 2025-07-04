import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserService } from '@/services/userService'
import { AUTH_ERRORS, API_ERRORS, SERVICE_ERRORS, USER_ERRORS } from '@/constants/response_messages'

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: AUTH_ERRORS.NOT_AUTHENTICATED },
        { status: 401 }
      )
    }
    const userService = new UserService()
    const user = await userService.findUserByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json(
        { error: AUTH_ERRORS.USER_NOT_FOUND },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error(API_ERRORS.PROFILE_FETCH_ERROR, error)
    return NextResponse.json(
      { error: SERVICE_ERRORS.SERVER_ERROR },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: AUTH_ERRORS.NOT_AUTHENTICATED },
        { status: 401 }
      )
    }

    const { name, email } = await req.json()
    
    if (!name || !email) {
      return NextResponse.json(
        { error: USER_ERRORS.NAME_AND_EMAIL_REQUIRED },
        { status: 400 }
      )
    }

    try {
      const userService = new UserService()
      const user = await userService.updateUser(session.user.email, { name, email })
      return NextResponse.json(user)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes(USER_ERRORS.EMAIL_ALREADY_TAKEN)) {
          return NextResponse.json(
            { error: error.message },
            { status: 409 }
          )
        }
        if (error.message === 'User not found') {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          )
        }
      }
      throw error // Re-throw unexpected errors to be caught by outer catch
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: SERVICE_ERRORS.SERVER_ERROR },
      { status: 500 }
    )
  }
} 