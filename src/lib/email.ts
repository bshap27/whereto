import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WhereTo <onboarding@resend.dev>', // Update with your verified domain
      to: [email],
      subject: 'Reset your WhereTo password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested a password reset for your WhereTo account. Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="${resetUrl}" 
              style="
                background-color: #4f46e5; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                display: inline-block;
                font-weight: bold;
              "
            >
              Reset Password
            </a>
          </div>
          <p style="color: #666; line-height: 1.6;">
            If you didn't request this password reset, you can safely ignore this email. The link will expire in 1 hour.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #4f46e5; word-break: break-all;">
            ${resetUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from WhereTo. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
} 