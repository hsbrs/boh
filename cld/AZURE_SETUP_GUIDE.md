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

### Microsoft Entra ID (Authentication)
**Note**: Use your existing organizational Entra ID tenant, don't create B2C
1. Go to "Microsoft Entra ID" in Azure Portal
2. Navigate to "App registrations"
3. Verify your organizational tenant is active
4. Note your Tenant ID for app registration

### Azure Cosmos DB (Primary Database)
1. Search for "Azure Cosmos DB" in Azure Portal
2. Click "Create" → "Azure Cosmos DB for NoSQL"
3. Configure:
   - Resource Group: Use "boh-migration-rg"
   - Account Name: "boh-cosmos-db" (globally unique)
   - Location: Choose closest to your users
   - Capacity mode: Provisioned throughput
   - Apply Free Tier Discount: Yes (if available)
   - Backup Policy: Locally redundant
4. Click "Review + create"

### Azure SQL Database (Optional - for reporting)
1. Search for "SQL databases" in Azure Portal
2. Click "Create"
3. Configure:
   - Database name: "boh-reporting-db"
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
- **Microsoft Entra ID**: Included with Microsoft 365
- **Azure Cosmos DB**: ~$25-50/month (400-1000 RU/s)
- **Azure SQL Basic**: ~$5 (optional)
- **Azure App Service Basic**: ~$13
- **Microsoft 365**: Existing subscription
- **Total estimated**: ~$45-70/month

**Note**: Cosmos DB costs scale with usage. Monitor Request Units (RU) consumption.

## Next Steps
After setup, proceed to:
1. App Registration (see AZURE_APP_REGISTRATION.md)
2. Graph API permissions configuration
3. Azure Cosmos DB database and container setup
4. SharePoint site setup for file storage

⚠️ **Important**: Azure Cosmos DB is now the primary database instead of SharePoint Lists for better performance and scalability with your 20,000+ records.