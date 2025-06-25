import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { UserService } from '@/services/userService'

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    const userService = new UserService()
    const user = await userService.findUserByEmail(session.user.email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Server error' },
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
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { name, email } = await req.json()
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    try {
      const userService = new UserService()
      const user = await userService.updateUser(session.user.email, { name, email })
      return NextResponse.json(user)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email is already taken') {
          return NextResponse.json(
            { error: 'Email is already taken' },
            { status: 400 }
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
      { error: 'Server error' },
      { status: 500 }
    )
  }
} 