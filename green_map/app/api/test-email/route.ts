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
    console.log(`Sending test email to: ${email}`);
    const emailSent = await sendTestEmail(email);
    
    return NextResponse.json({
      success: true,
      message: `Test email ${emailSent ? 'sent' : 'failed'} to ${email}`,
      emailSent
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending test email' },
      { status: 500 }
    );
  }
}
