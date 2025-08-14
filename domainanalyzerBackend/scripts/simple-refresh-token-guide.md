# Simple Refresh Token Generation Guide

## Prerequisites
- Google Cloud Console project with OAuth 2.0 credentials
- Client ID and Client Secret from Google Cloud Console

## Step-by-Step Process

### 1. Create the Authorization URL

Replace `YOUR_CLIENT_ID` with your actual client ID:

```
https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000&scope=https://www.googleapis.com/auth/adwords&response_type=code&access_type=offline&prompt=consent
```

### 2. Open the URL in Browser

1. Paste the URL in your browser
2. Sign in with your Google account
3. Grant permissions for Google Ads API access
4. You'll be redirected to `http://localhost:3000/?code=AUTHORIZATION_CODE`
5. Copy the `code` parameter value

### 3. Exchange Code for Refresh Token

Use this curl command (replace values with your actual credentials):

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTHORIZATION_CODE_FROM_STEP_2" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost:3000"
```

### 4. Extract Refresh Token

The response will look like:
```json
{
  "access_token": "...",
  "expires_in": 3599,
  "refresh_token": "1//0G...", 
  "scope": "https://www.googleapis.com/auth/adwords",
  "token_type": "Bearer"
}
```

Copy the `refresh_token` value and add it to your `.env` file.

## Important Notes

- **Use `access_type=offline`** - This is crucial for getting a refresh token
- **Use `prompt=consent`** - Forces the consent screen to show refresh token
- **Redirect URI must match** - What you set in Google Cloud Console
- **Refresh tokens expire** - You may need to regenerate periodically

## Environment Variables

After getting the refresh token, add these to your `.env` file:

```env
GOOGLE_ADS_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
GOOGLE_ADS_LOGIN_CUSTOMER_ID="1234567890"
GOOGLE_ADS_REFRESH_TOKEN="1//0G_your_refresh_token_here"
```

## Troubleshooting

- **No refresh token returned**: Make sure you used `access_type=offline` and `prompt=consent`
- **Invalid redirect URI**: Check that the redirect URI matches exactly what's in Google Cloud Console
- **Scope error**: Make sure you're using the correct Google Ads API scope 