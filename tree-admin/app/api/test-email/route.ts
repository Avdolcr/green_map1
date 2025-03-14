import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    
    // Send test email
    console.log(`Sending admin test email to: ${email}`);
    const emailSent = await sendTestEmail(email);
    
    return NextResponse.json({
      success: true,
      message: `Admin test email ${emailSent ? 'sent' : 'failed'} to ${email}`,
      emailSent
    });
    
  } catch (error) {
    console.error('Admin test email error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending admin test email' },
      { status: 500 }
    );
  }
}
