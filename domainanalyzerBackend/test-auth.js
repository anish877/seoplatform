require('dotenv').config();
const { GoogleAdsApi } = require('google-ads-api');

async function testAuth() {
  try {
    console.log('🔍 Checking Google Ads API Authentication...\n');
    
    // Check current credentials
    console.log('📋 Current Credentials:');
    console.log('Client ID:', process.env.GOOGLE_ADS_CLIENT_ID ? '✓ Set' : '✗ Missing');
    console.log('Client Secret:', process.env.GOOGLE_ADS_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
    console.log('Developer Token:', process.env.GOOGLE_ADS_DEVELOPER_TOKEN ? '✓ Set' : '✗ Missing');
    console.log('Customer ID:', process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ? '✓ Set' : '✗ Missing');
    console.log('Refresh Token:', process.env.GOOGLE_ADS_REFRESH_TOKEN ? '✓ Set' : '✗ Missing');
    
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    });

    console.log('\n✅ Client and customer created successfully');
    
    // Test simple query first
    console.log('\n📊 Testing basic authentication...');
    const stream = customer.queryStream(`
      SELECT customer.id, customer.descriptive_name 
      FROM customer 
      LIMIT 1
    `);
    
    for await (const row of stream) {
      console.log('✅ Authentication successful!');
      console.log('Customer:', row);
      break;
    }
    
    console.log('\n🎯 Testing Keyword Planner API...');
    const request = {
      customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      language: 'languageConstants/1000',
      geo_target_constants: ['geoTargetConstants/2840'],
      include_adult_keywords: false,
      keyword_plan_network: 3,
      keyword_seed: { keywords: ['test'] }
    };
    
    const response = await customer.keywordPlanIdeas.generateKeywordIdeas(request);
    console.log('✅ Keyword Planner API working!');
    console.log(`Found ${response.results?.length || 0} keyword ideas`);
    
    if (response.results && response.results.length > 0) {
      console.log('\n📈 Sample keyword data:');
      const sample = response.results[0];
      console.log('Keyword:', sample.text);
      console.log('Search Volume:', sample.keyword_idea_metrics?.avg_monthly_searches || 'N/A');
      console.log('Competition:', sample.keyword_idea_metrics?.competition || 'N/A');
    }
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 Issue: Refresh token has expired. Need a new refresh token.');
    } else if (error.message.includes('unauthorized_client')) {
      console.log('\n💡 Issue: OAuth credentials are invalid or missing permissions.');
    } else {
      console.log('\n💡 Issue: Unknown authentication problem.');
    }
  }
}

testAuth(); 