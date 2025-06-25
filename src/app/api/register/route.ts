import { NextResponse } from 'next/server'
import { UserService } from '@/services/userService'
import { SERVICE_ERRORS, API_ERRORS, API_SUCCESS_MESSAGES, USER_ERRORS } from '@/constants/response_messages'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()
    const userService = new UserService()

    const user = await userService.createUser({ name, email, password })

    return NextResponse.json(
      { 
        message: API_SUCCESS_MESSAGES.USER_CREATED_SUCCESS,
        user
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(API_ERRORS.REGISTRATION_ERROR, error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === USER_ERRORS.REQUIRED_FIELDS_MISSING) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message === USER_ERRORS.USER_ALREADY_EXISTS) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: SERVICE_ERRORS.SERVER_ERROR },
      { status: 500 }
    )
  }
} 