# Microsoft Azure Account Setup Guide

## Prerequisites
- Microsoft 365 Business Premium or Enterprise subscription
- Azure subscription (can use free tier initially)
- Global Administrator rights for your organization

## Step 1: Azure Portal Setup
1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Microsoft 365 admin account
3. If no Azure subscription exists, create one (free tier available)

## Step 2: Required Azure Services

### Azure Active Directory B2C (Authentication)
1. Search for "Azure AD B2C" in Azure Portal
2. Click "Create" and select:
   - Subscription: Your Azure subscription
   - Resource Group: Create new (e.g., "boh-migration-rg")
   - Organization name: Your company name
   - Initial domain name: Choose unique name (e.g., "boh-company")
   - Country/Region: Your location
3. Click "Create and link to subscription"

### Azure SQL Database (Optional - for complex queries)
1. Search for "SQL databases" in Azure Portal
2. Click "Create"
3. Configure:
   - Database name: "boh-database"
   - Server: Create new server
   - Pricing tier: Basic (for development)
   - Backup storage redundancy: Locally-redundant

### Azure App Service (for hosting)
1. Search for "App Services" in Azure Portal
2. Click "Create"
3. Configure:
   - Resource Group: Use existing "boh-migration-rg"
   - Name: "boh-app" (must be globally unique)
   - Runtime stack: Node.js 18 LTS
   - Operating System: Linux
   - Region: Choose closest to your users

## Step 3: Microsoft 365 Admin Center Setup
1. Go to [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Navigate to "Setup" → "Apps and email"
3. Enable required services:
   - SharePoint Online
   - Microsoft Teams
   - Exchange Online (for calendar)

## Step 4: SharePoint Site Setup
1. Go to [SharePoint Admin Center](https://admin.sharepoint.com)
2. Click "Sites" → "Active sites"
3. Click "Create" → "Team site"
4. Configure:
   - Site name: "BOH Management System"
   - Description: "Vacation and project management system"
   - Privacy settings: Private
   - Default language: German (if needed)

## Step 5: Cost Estimates (Monthly)
- **Azure AD B2C**: ~$0.50-2.00 per 1000 users
- **Azure SQL Basic**: ~$5
- **Azure App Service Basic**: ~$13
- **Microsoft 365**: Existing subscription
- **Total estimated**: ~$20-25/month for small team

## Next Steps
After setup, proceed to:
1. App Registration (see AZURE_APP_REGISTRATION.md)
2. Graph API permissions configuration
3. SharePoint Lists setup