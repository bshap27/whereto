import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { USER_ERRORS, AUTH_ERRORS, VALIDATION_ERRORS, SERVICE_ERRORS, API_SUCCESS_MESSAGES } from '@/constants/response_messages';

export async function POST(request: NextRequest) {
  const userService = new UserService()
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: USER_ERRORS.TOKEN_AND_PASSWORD_REQUIRED },
        { status: 400 }
      );
    }

    try {
      await userService.resetPassword(token, password);
      
      return NextResponse.json(
        { message: API_SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === VALIDATION_ERRORS.PASSWORD_TOO_SHORT) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
        if (error.message === AUTH_ERRORS.INVALID_RESET_TOKEN) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
      }
      throw error; // Re-throw unexpected errors to be caught by outer catch
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: SERVICE_ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
} 