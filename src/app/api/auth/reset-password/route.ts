import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';

export async function POST(request: NextRequest) {
  const userService = new UserService()
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    try {
      await userService.resetPassword(token, password);
      
      return NextResponse.json(
        { message: 'Password has been reset successfully' },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Password must be at least 6 characters long') {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          );
        }
        if (error.message === 'Invalid or expired reset token') {
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 