import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/emailService';

export async function GET(req: NextRequest) {
  try {
    // Always send to the authorized recipient (nasab2@gmail.com)
    const emailSent = await sendTestEmail('nasab2@gmail.com');
    
    // Return user-friendly response
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Test email sent successfully to nasab2@gmail.com! Check your inbox.' 
        : 'Failed to send test email. Check server logs for details.',
      note: "When using Mailgun sandbox domains, emails can only be sent to authorized recipients. Your email in the database will still be stored correctly, but all test emails will be sent to nasab2@gmail.com."
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending test email' },
      { status: 500 }
    );
  }
}
