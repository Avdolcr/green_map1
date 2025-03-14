import { NextRequest, NextResponse } from 'next/server';

// The most direct and simplified Mailgun API test
export async function GET(req: NextRequest) {
  try {
    // Configuration
    const MAILGUN_API_KEY = 'b291fe4e4fbff37b7ede91fc85a7fdc9-4b98d8d3-d9e6ae6d';
    const MAILGUN_DOMAIN = 'sandbox4af5aee07da67e0aac606a3980df82230.mailgun.org';
    
    // Prepare email data
    const formData = new URLSearchParams();
    formData.append('from', `mailgun@${MAILGUN_DOMAIN}`);
    formData.append('to', 'nasab2@gmail.com');
    formData.append('subject', 'Simple Mailgun Test');
    formData.append('text', 'This is a simple test email from Green Map.');
    formData.append('html', `
      <div>
        <h2>Simple Mailgun Test</h2>
        <p>This is a simple test email sent at ${new Date().toLocaleString()}</p>
        <p>The Green Map chatbot now includes a comprehensive knowledge base with information about trees, environmental benefits, and the Green Map project.</p>
      </div>
    `);
    
    // Basic authentication header
    const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
    
    // Make the API request
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    // Process response
    const responseText = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseText,
      message: response.ok ? 'Email sent successfully!' : 'Failed to send email'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
