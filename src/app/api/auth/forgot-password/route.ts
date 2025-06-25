import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { sendPasswordResetEmail } from '@/lib/email';
import { USER_ERRORS, SERVICE_ERRORS, API_SUCCESS_MESSAGES } from '@/constants/response_messages';

export async function POST(request: NextRequest) {
  const userService = new UserService()
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: USER_ERRORS.EMAIL_REQUIRED },
        { status: 400 }
      );
    }

    try {
      // Check if user exists and generate reset token
      const user = await userService.findUserByEmail(email);
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return NextResponse.json(
          { message: API_SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT },
          { status: 200 }
        );
      }

      // Generate reset token
      const { resetToken } = await userService.generateResetToken(email);

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      
      try {
        // Send email
        await sendPasswordResetEmail(email, resetUrl);
        
        return NextResponse.json(
          { message: API_SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT },
          { status: 200 }
        );
      } catch (emailError) {
        // If email fails, clean up the token and return error
        await userService.clearResetToken(email);
        
        console.error('Email sending failed:', emailError);
        return NextResponse.json(
          { error: SERVICE_ERRORS.EMAIL_SENDING_FAILED },
          { status: 500 }
        );
      }
    } catch (error) {
      // Check if this is a "user not found" error or an actual database error
      if (error instanceof Error && error.message.includes('User not found')) {
        // Don't reveal if user exists or not for security
        return NextResponse.json(
          { message: API_SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT },
          { status: 200 }
        );
      }
      // Re-throw actual database/system errors to be caught by outer catch
      throw error;
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: SERVICE_ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
} 