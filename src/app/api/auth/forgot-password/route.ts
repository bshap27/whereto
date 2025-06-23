import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Hash the token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save the hashed token and expiry to the user
    user.resetToken = hashedToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In a real application, you would send an email here
    // For now, we'll log the reset link to the console
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    console.log('Password reset link:', resetUrl);
    console.log('This would be sent via email in production');

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 