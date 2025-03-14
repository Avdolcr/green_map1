# Troubleshooting Guide for GreenMap Authentication

## Common Authentication Issues

### "Cookie storage issue detected" Message

If you see a message about cookie storage issues when trying to log in, this means your browser may be blocking cookies that the application needs to function properly. Try these solutions:

1. **Visit the test page**: Go to `/test-auth` to run a diagnostic on your authentication and cookie status.

2. **Check browser cookie settings**:
   - Make sure cookies are enabled in your browser settings
   - Ensure third-party cookies are not blocked for this domain
   - Check if you have any browser extensions that might be blocking cookies

3. **Try a different browser**: Some browsers have stricter cookie policies. Try using Chrome, Firefox, or Edge.

4. **Clear cookies and cache**: Clear your browser cookies and cache, then try again.

5. **Reset cookies**: On the test page, use the "Reset & Fix Cookies" button.

### Runtime Compatibility Issues

If you see errors related to "runtime compatibility" or "crypto module", try:

1. **Refresh the page**: Simply refreshing might resolve temporary issues.

2. **Clear your browser cache**: This ensures you're using the latest code.

3. **Wait and try again**: The server might be redeploying with updated configuration.

## For Developers

If you're developing or maintaining the application:

1. The application has been configured to use the `nodejs` runtime for middleware and API routes that handle JWT verification.

2. Check the cookie settings in the login API route when making changes.

3. Make sure the domain setting for cookies is appropriate for your deployment environment.

4. Browser developer tools can help identify cookie issues - look at the Application/Storage tab.

5. If needed, edit the `next.config.mjs` file to adjust middleware settings.

## When All Else Fails

1. Try accessing the site in an Incognito/Private browser window.

2. Ensure your system time is correct (JWT token verification depends on accurate time).

3. If you're using a VPN or proxy, try disabling it temporarily.

4. Contact support with the error messages you're seeing. 