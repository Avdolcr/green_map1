// Email service for Green Map application using Mailgun
// This service will handle sending welcome emails to users

// MAILGUN CONFIGURATION
const MAILGUN_API_KEY = 'b291fe4e4fbff37b7ede91fc85a7fdc9-4b98d8d3-d9e6ae6d'; // Complete API key
const MAILGUN_DOMAIN = 'sandbox4af5aee07da67e0aac606a3980df82230.mailgun.org'; // Full sandbox domain

// Default sender email - must use the sandbox domain format for sandbox domains
const DEFAULT_FROM_EMAIL = 'mailgun@sandbox4af5aee07da67e0aac606a3980df82230.mailgun.org';
// Authorized recipient - only this email will receive messages when using sandbox
const AUTHORIZED_RECIPIENT = 'nasab2@gmail.com';

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

// When using Node.js environment, fetch is available globally
export async function sendEmail(config: EmailConfig): Promise<boolean> {
  try {
    console.log('📧 Attempting to send email to:', config.to);
    
    // Always send to the authorized recipient in sandbox mode
    const originalTo = config.to;
    console.log(`Original recipient: ${originalTo}`);
    
    // Override recipient with authorized email
    const to = AUTHORIZED_RECIPIENT;
    
    // Always use the sandbox sender format
    const from = DEFAULT_FROM_EMAIL;
    
    console.log('Email details:', {
      from,
      to,
      subject: config.subject
    });

    // Create request body as URLSearchParams (works better than FormData in this context)
    const payload = new URLSearchParams();
    payload.append('from', from);
    payload.append('to', to);
    payload.append('subject', config.subject);
    payload.append('html', config.html);
    
    // Using native fetch with proper authorization
    const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64');
    
    console.log(`Sending to Mailgun API for domain: ${MAILGUN_DOMAIN}`);
    
    // Send the request
    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });
    
    const responseText = await response.text();
    console.log(`Mailgun API response status: ${response.status}`);
    console.log(`Mailgun API response: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ Email sent successfully!');
      return true;
    } else {
      console.error('❌ Mailgun API error:', responseText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

// Test function to verify email configuration works
export async function sendTestEmail(to: string): Promise<boolean> {
  const testContent = {
    subject: 'Green Map Test Email',
    text: 'This is a test email from Green Map to verify email functionality.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h1 style="color: #10b981;">Green Map Test Email</h1>
        <p>This is a test email from Green Map to verify that our email functionality is working correctly.</p>
        <p>If you received this email, it means our system is configured properly!</p>
        <p>Time sent: ${new Date().toLocaleString()}</p>
        <p><strong>Note:</strong> This email was sent to nasab2@gmail.com because you're using a Mailgun Sandbox account.</p>
        <hr>
        <p>The Green Map chatbot has been enhanced with a comprehensive knowledge base containing information about trees, the Green Map project, environmental benefits, and more. The knowledge base includes 15 categories of information with multiple questions and answers in each category. The chatbot now first checks this knowledge base before falling back to database searches, making it much more intelligent and responsive.</p>
      </div>
    `
  };
  
  return sendEmail({
    from: DEFAULT_FROM_EMAIL,
    to, // Will be overridden to use authorized recipient
    subject: testContent.subject,
    text: testContent.text,
    html: testContent.html
  });
}

// Generate HTML template for welcome email
export function generateWelcomeEmail(name: string, role: string = 'user'): { subject: string; html: string; text: string } {
  const isAdmin = role === 'admin';
  const subject = 'Welcome to Green Map!';
  
  const text = `Welcome ${name} to Green Map! Thank you for joining our community of nature enthusiasts.`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .email-container {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 24px;
          text-align: center;
        }
        .content {
          background: #ffffff;
          padding: 24px;
          border-bottom: 1px solid #eaeaea;
        }
        .footer {
          background: #f9fafb;
          padding: 16px 24px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
        }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .button {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 600;
          margin-top: 16px;
        }
        .features {
          margin-top: 24px;
          display: table;
          width: 100%;
        }
        .feature {
          margin-bottom: 16px;
        }
        .feature-icon {
          display: table-cell;
          width: 60px;
          vertical-align: top;
          padding-right: 12px;
        }
        .feature-text {
          display: table-cell;
          vertical-align: top;
        }
        .social-links {
          margin-top: 16px;
        }
        .social-link {
          display: inline-block;
          margin: 0 8px;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          padding: 10px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }
        .eco-tip {
          background: #f0fdf4;
          border-left: 4px solid #10b981;
          padding: 12px 16px;
          margin-top: 24px;
          border-radius: 4px;
        }
        .eco-tip h3 {
          margin-top: 0;
          color: #047857;
          font-size: 16px;
        }
        .eco-tip p {
          margin-bottom: 0;
          color: #065f46;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">
            🌳
          </div>
          <h1>Welcome to Green Map!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          
          <p>We're thrilled to welcome you to Green Map! Thank you for joining our growing community of nature enthusiasts and environmental advocates.</p>
          
          <p>With your new account, you can now:</p>
          
          <div class="features">
            <div class="feature">
              <div class="feature-icon">🌳</div>
              <div class="feature-text">
                <strong>Explore Trees:</strong> Discover trees in your neighborhood and learn about different species.
              </div>
            </div>
            <div class="feature">
              <div class="feature-icon">📱</div>
              <div class="feature-text">
                <strong>Interactive Map:</strong> Navigate through our interactive map showcasing urban greenery.
              </div>
            </div>
            <div class="feature">
              <div class="feature-icon">💬</div>
              <div class="feature-text">
                <strong>Ask Our Intelligent Chatbot:</strong> Get expert information about trees, environmental benefits, conservation, and Green Map project details from our comprehensive knowledge base.
              </div>
            </div>
            <div class="feature">
              <div class="feature-icon">🤝</div>
              <div class="feature-text">
                <strong>Join the Community:</strong> Connect with like-minded individuals passionate about environmental conservation.
              </div>
            </div>
          </div>
          
          <div class="eco-tip">
            <h3>🌱 Eco Tip of the Day</h3>
            <p>Did you know? A single mature tree can absorb up to 48 pounds of carbon dioxide per year and release enough oxygen to support two human beings.</p>
          </div>
          
          <p style="margin-top: 24px;">Ready to start exploring? Click the button below to begin your green journey:</p>
          
          <div style="text-align: center;">
            <a href="https://greenmap.example.com/explore" class="button">
              Start Exploring
            </a>
          </div>
          
          <p style="margin-top: 24px;">If you have any questions or need assistance, our intelligent chatbot is available 24/7 to help with information from our extensive knowledge base, or you can contact our support team.</p>
          
          <p>Thank you for being part of our mission to promote urban greenery and environmental awareness!</p>
          
          <p>Best regards,<br>The Green Map Team</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Green Map. All rights reserved.</p>
          <div class="social-links">
            <a href="#" class="social-link">Facebook</a> | 
            <a href="#" class="social-link">Twitter</a> | 
            <a href="#" class="social-link">Instagram</a>
          </div>
          <p style="margin-top: 16px; font-size: 12px;">
            You're receiving this email because you recently signed up for a Green Map account.<br>
            <a href="#">Unsubscribe</a> from future emails.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject, html, text };
}
