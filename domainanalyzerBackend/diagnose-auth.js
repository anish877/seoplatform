require('dotenv').config();
const { GoogleAdsApi } = require('google-ads-api');

async function diagnoseAuth() {
  try {
    console.log('🔍 Diagnosing Google Ads API Authentication...\n');
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    const vars = {
      'GOOGLE_ADS_CLIENT_ID': process.env.GOOGLE_ADS_CLIENT_ID,
      'GOOGLE_ADS_CLIENT_SECRET': process.env.GOOGLE_ADS_CLIENT_SECRET,
      'GOOGLE_ADS_DEVELOPER_TOKEN': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'GOOGLE_ADS_LOGIN_CUSTOMER_ID': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      'GOOGLE_ADS_REFRESH_TOKEN': process.env.GOOGLE_ADS_REFRESH_TOKEN
    };
    
    for (const [key, value] of Object.entries(vars)) {
      if (value) {
        console.log(`✓ ${key}: ${value.substring(0, 15)}...`);
      } else {
        console.log(`✗ ${key}: MISSING`);
      }
    }
    
    console.log('\n🔧 Testing Client Creation...');
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });
    console.log('✅ Client created successfully');
    
    console.log('\n👤 Testing Customer Creation...');
    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });
    console.log('✅ Customer created successfully');
    
    console.log('\n🔍 Available Customer Services:');
    for (const key in customer) {
      if (typeof customer[key] === 'object' && customer[key] !== null) {
        console.log(`- ${key}:`, Object.keys(customer[key]));
      }
    }
    
    console.log('\n📊 Testing Basic Query...');
    try {
      const stream = customer.queryStream(`
        SELECT customer.id, customer.descriptive_name 
        FROM customer 
        LIMIT 1
      `);
      
      for await (const row of stream) {
        console.log('✅ Basic query successful!');
        console.log('Customer data:', row);
        break;
      }
    } catch (queryError) {
      console.log('❌ Basic query failed:', queryError.message);
      console.log('Error code:', queryError.code);
      console.log('Error details:', queryError.details);
      
      // Provide specific guidance based on error
      if (queryError.message.includes('unauthorized_client')) {
        console.log('\n💡 Possible Solutions:');
        console.log('1. Check OAuth app configuration in Google Cloud Console');
        console.log('2. Verify the OAuth app has the correct redirect URI');
        console.log('3. Ensure the OAuth app has the required scope: https://www.googleapis.com/auth/adwords');
        console.log('4. Check if the developer token has the right permissions');
        console.log('5. Verify the customer ID has API access enabled');
      }
    }
    
  } catch (error) {
    console.log('\n❌ Diagnosis failed:', error.message);
    console.log('Full error:', error);
  }
}

diagnoseAuth(); 