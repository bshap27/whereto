import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const userService = new UserService()
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    try {
      // Check if user exists and generate reset token
      const user = await userService.findUserByEmailForPasswordReset(email);
      
      if (!user) {
        // Don't reveal if user exists or not for security
        return NextResponse.json(
          { message: 'If an account with that email exists, a password reset link has been sent.' },
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
          { message: 'If an account with that email exists, a password reset link has been sent.' },
          { status: 200 }
        );
      } catch (emailError) {
        // If email fails, clean up the token and return error
        await userService.clearResetToken(email);
        
        console.error('Email sending failed:', emailError);
        return NextResponse.json(
          { error: 'Failed to send password reset email. Please try again later.' },
          { status: 500 }
        );
      }
    } catch (error) {
      // If user not found, still return success for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 