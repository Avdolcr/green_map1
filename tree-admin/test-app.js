// Simple test script to check if the app can start without the window error
console.log('Starting application test...');
console.log('Testing environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Load Next.js
try {
  console.log('Testing Next.js import...');
  require('next');
  console.log('Next.js imported successfully');
} catch (err) {
  console.error('Error importing Next.js:', err);
}

console.log('Test completed. If you see this message, the script executed without crashing.');
console.log('To run the app, use: npm run dev'); 