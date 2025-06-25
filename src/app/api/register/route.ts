import { NextResponse } from 'next/server'
import { UserService } from '@/services/userService'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()
    const userService = new UserService()

    const user = await userService.createUser({ name, email, password })

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Please provide all required fields') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    )
  }
} 