# Azure AD App Registration Guide

## Step 1: Register Application in Azure Portal

### Navigate to App Registrations
1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure Active Directory"
3. Click "App registrations" in left menu
4. Click "New registration"

### Configure App Registration
- **Name**: "BOH Management System"
- **Supported account types**: "Accounts in this organizational directory only"
- **Redirect URI**:
  - Type: Web
  - URI: `http://localhost:3000/api/auth/callback` (development)
  - URI: `https://your-domain.com/api/auth/callback` (production)

## Step 2: Configure Authentication

### Add Platform Configuration
1. Click on your registered app
2. Go to "Authentication" in left menu
3. Click "Add a platform" → "Web"
4. Add redirect URIs:
   ```
   http://localhost:3000/api/auth/callback
   https://your-app-domain.com/api/auth/callback
   ```
5. Enable "ID tokens" and "Access tokens"
6. Set logout URL: `http://localhost:3000/api/auth/logout`

### Configure Implicit Grant (if needed)
- Check "Access tokens" and "ID tokens"

## Step 3: API Permissions

### Add Microsoft Graph Permissions
1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph"
3. Select "Delegated permissions" and add:

**User Management:**
- User.Read
- User.ReadBasic.All
- Directory.Read.All

**SharePoint:**
- Sites.ReadWrite.All
- Files.ReadWrite.All

**Teams:**
- Chat.ReadWrite
- TeamsActivity.Send
- Channel.ReadBasic.All

**Calendar:**
- Calendar.ReadWrite
- Calendar.ReadWrite.Shared

**Additional:**
- Mail.Send
- People.Read
- Presence.Read.All

4. Click "Add permissions"
5. Click "Grant admin consent" (requires admin privileges)

## Step 4: Create Client Secret

### Generate Secret
1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "BOH App Secret"
4. Expires: 24 months (recommended)
5. Click "Add"
6. **IMPORTANT**: Copy the secret value immediately (won't be shown again)

## Step 5: Configure Manifest (Optional)

### Enable OAuth2 Implicit Flow
1. Go to "Manifest"
2. Set `"oauth2AllowImplicitFlow": true`
3. Set `"oauth2AllowIdTokenImplicitFlow": true`
4. Click "Save"

## Step 6: Environment Variables for Next.js

Create `.env.local` file with:
```env
# Azure AD Configuration
AZURE_AD_CLIENT_ID="your-application-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"

# Auth URLs
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Microsoft Graph
GRAPH_API_ENDPOINT="https://graph.microsoft.com/v1.0"

# SharePoint
SHAREPOINT_SITE_URL="https://yourtenant.sharepoint.com/sites/boh-management"
```

## Step 7: Required Information to Collect

After registration, collect these values:
- **Application (client) ID**: Found in "Overview"
- **Directory (tenant) ID**: Found in "Overview"
- **Client secret**: Created in "Certificates & secrets"
- **Authority URL**: `https://login.microsoftonline.com/{tenant-id}`

## Step 8: Test Configuration

### Using Graph Explorer
1. Go to [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Sign in with your account
3. Test basic queries:
   - `GET /me` (your profile)
   - `GET /users` (all users)
   - `GET /sites` (SharePoint sites)

## Security Best Practices

- **Never commit secrets** to version control
- Use **Azure Key Vault** for production secrets
- **Rotate secrets** regularly (every 6-12 months)
- **Monitor** API usage and permissions
- **Use least-privilege** principle for permissions
- Enable **conditional access** policies if available

## Troubleshooting

### Common Issues
1. **Permission denied**: Ensure admin consent granted
2. **Invalid redirect**: Check redirect URI matches exactly
3. **Token issues**: Verify client secret is correct
4. **Scope errors**: Check required permissions are added

### Debug Steps
1. Check app registration configuration
2. Verify environment variables
3. Test with Graph Explorer
4. Review Azure AD logs