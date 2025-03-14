import { NextRequest, NextResponse } from 'next/server';

// Direct Mailgun API test to diagnose issues
export async function GET(req: NextRequest) {
  try {
    // Mailgun configuration
    const MAILGUN_API_KEY = 'b291fe4e4fbff37b7ede91fc85a7fdc9-4b98d8d3-d9e6ae6d';
    const MAILGUN_DOMAIN = 'sandbox4af5aee07da67e0aac606a3980df82230.mailgun.org';
    const from = `mailgun@${MAILGUN_DOMAIN}`;
    const to = 'nasab2@gmail.com'; // Authorized recipient
    
    console.log('Testing direct Mailgun API call');
    console.log(`Domain: ${MAILGUN_DOMAIN}`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    
    // Create form data for direct API test
    const formData = new URLSearchParams();
    formData.append('from', from);
    formData.append('to', to);
    formData.append('subject', 'Green Map Direct API Test');
    formData.append('html', `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Green Map Email Test</h1>
        <p>This is a direct API test from the Green Map application.</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
        <hr>
        <p>The Green Map chatbot has been enhanced with a comprehensive knowledge base containing information about trees, the Green Map project, environmental benefits, and more. The knowledge base includes 15 categories of information with multiple questions and answers in each category.</p>
      </div>
    `);
    
    // Create auth header
    const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
    
    // Make direct API call
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    // Get response as text first
    const responseText = await response.text();
    console.log(`Mailgun response status: ${response.status}`);
    console.log(`Mailgun API response: ${responseText}`);
    
    // Parse if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { text: responseText };
    }
    
    // Return detailed response
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      mailgunResponse: responseData,
      message: response.ok 
        ? 'Email sent successfully! Check nasab2@gmail.com inbox.'
        : 'Failed to send email. See details in response.',
      configuration: {
        domain: MAILGUN_DOMAIN,
        from: from,
        to: to,
        key: `${MAILGUN_API_KEY.substring(0, 8)}...${MAILGUN_API_KEY.substring(MAILGUN_API_KEY.length - 8)}`
      }
    });
  } catch (error) {
    console.error('Error in direct Mailgun test:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Exception occurred during API call'
    }, { status: 500 });
  }
}
