# Google Ads API Setup Guide

This guide will help you set up Google Ads API integration for keyword research.

## Prerequisites

1. Google Ads account with active campaigns (recommended)
2. Google Cloud Console project
3. Google Ads API access

## Step 1: Create Google Cloud Console Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Ads API

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as application type
4. Add authorized redirect URIs (e.g., `http://localhost:3000/auth/callback`)
5. Note down `Client ID` and `Client Secret`

## Step 3: Get Developer Token

1. Go to [Google Ads API Center](https://ads.google.com/nav/tools/api-center)
2. Apply for API access
3. Once approved, you'll get a Developer Token

## Step 4: Get Refresh Token

You need to generate a refresh token using OAuth 2.0 flow. You can use tools like:

- [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- Or implement the OAuth flow in your application

### Using OAuth Playground:
1. Go to https://developers.google.com/oauthplayground/
2. Select "Google Ads API v14" scope: `https://www.googleapis.com/auth/adwords`
3. Click "Authorize APIs"
4. Exchange authorization code for tokens
5. Copy the `refresh_token`

## Step 5: Environment Variables

Add these environment variables to your `.env` file:

```env
# Google Ads API Configuration
GOOGLE_ADS_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
GOOGLE_ADS_LOGIN_CUSTOMER_ID="1234567890"  # Your Google Ads Customer ID (without dashes)
GOOGLE_ADS_REFRESH_TOKEN="your-refresh-token"
```

## Step 6: Install Dependencies

The Google Ads API package should already be installed. If not:

```bash
npm install google-ads-api
```

## Step 7: Test the Integration

1. Start your backend server
2. Create a domain analysis
3. The keyword discovery should now use Google Ads API for real search volume data

## Fallback Behavior

If Google Ads API is not configured or fails:
- The system will automatically fall back to AI-generated keywords
- Users will see a warning in the console
- The application will continue to work with estimated data

## Troubleshooting

### Common Issues:

1. **Invalid Customer ID**: Ensure the Customer ID is numeric (no dashes)
2. **Expired Refresh Token**: Refresh tokens may expire, you'll need to regenerate
3. **API Quota Exceeded**: Google Ads API has rate limits
4. **Developer Token Not Approved**: Basic access level has limitations

### Error Messages:

- `Google Ads API configuration missing`: Check environment variables
- `Failed to generate keywords from Google Ads API`: Check API credentials and quotas
- `Google Ads API unavailable, using AI generation`: API call failed, using fallback

## API Limits

- **Basic Access**: Limited to test accounts only
- **Standard Access**: Full production access after approval
- **Rate Limits**: Varies by access level

For production use, you'll need to apply for Standard Access level.

## Alternative Approach

If you can't get Google Ads API access, the system will use AI-generated keywords as fallback, which still provides valuable keyword suggestions based on:

- Domain analysis
- Business context extraction
- Industry-specific keyword patterns
- Search intent modeling

## Support

For Google Ads API specific issues, refer to:
- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs)
- [Google Ads API Support](https://developers.google.com/google-ads/api/support) 