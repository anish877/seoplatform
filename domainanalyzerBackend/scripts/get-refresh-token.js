const readline = require('readline');
const { google } = require('googleapis');

// You'll need to fill these in with your OAuth credentials
const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
const CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'http://localhost:3000'; // Must match what you set in Google Console

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generate the URL for user authorization
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Important: this ensures we get a refresh token
  scope: ['https://www.googleapis.com/auth/adwords'],
});

console.log('\n🔗 Step 1: Open this URL in your browser:');
console.log(authUrl);
console.log('\n📋 Step 2: After authorizing, copy the "code" parameter from the redirect URL');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n✨ Step 3: Paste the authorization code here: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n🎉 Success! Here are your tokens:');
    console.log('\n📝 Add these to your .env file:');
    console.log(`GOOGLE_ADS_CLIENT_ID="${CLIENT_ID}"`);
    console.log(`GOOGLE_ADS_CLIENT_SECRET="${CLIENT_SECRET}"`);
    console.log(`GOOGLE_ADS_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\n💡 You still need:');
    console.log('- GOOGLE_ADS_DEVELOPER_TOKEN (from Google Ads API Center)');
    console.log('- GOOGLE_ADS_LOGIN_CUSTOMER_ID (your Google Ads Customer ID)');
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
  }
  
  rl.close();
}); 