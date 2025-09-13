# Authentication Migration: Firebase → Microsoft Entra ID

## Migration Overview

### Current Firebase Authentication
- Email/password authentication
- Role-based access control (employee, hr, pm, manager, admin)
- User approval workflow
- Custom claims for roles

### Target Microsoft Entra ID (formerly Azure AD)
- Enterprise single sign-on (SSO) with organizational accounts
- Multi-factor authentication (MFA)
- Conditional access policies
- Role-based access with Entra ID groups and app roles
- Seamless integration with existing organizational identity

## Implementation Steps

### 1. Install Required Packages
```bash
# NextAuth.js handles MSAL internally, so we primarily need:
npm install next-auth
npm install @azure/cosmos  # For Azure Cosmos DB
# MSAL packages only needed for direct Graph API calls if required:
# npm install @azure/msal-browser @azure/msal-react
```

### 2. Create Azure AD Configuration

**File: `lib/azure-config.js`**
```javascript
// Configuration for NextAuth.js with Microsoft Entra ID
export const azureConfig = {
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID, // Your organizational tenant ID
  authorization: {
    params: {
      scope: "openid profile email User.Read"
    }
  }
};

// Only needed if using MSAL directly for Graph API calls
export const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    redirectUri: process.env.NEXTAUTH_URL,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

### 3. Replace Firebase Auth with NextAuth

**File: `app/api/auth/[...nextauth]/route.js`**
```javascript
import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { azureConfig } from '@/lib/azure-config'

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: azureConfig.clientId,
      clientSecret: azureConfig.clientSecret,
      tenantId: azureConfig.tenantId, // Organizational tenant, not B2C
      authorization: azureConfig.authorization
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.azureObjectId = profile.oid // Azure AD Object ID
        token.role = await getUserRole(profile.email, profile.oid)
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.role = token.role
      session.user.azureObjectId = token.azureObjectId
      return session
    }
  }
})

export { handler as GET, handler as POST }
```

### 4. Create User Role Management

**File: `lib/azure-users.js`**
```javascript
import CosmosService from './cosmos-service';

export class UserService {
  static async getUserRole(email, azureObjectId) {
    try {
      // Get user from Azure Cosmos DB using Azure Object ID as primary identifier
      const user = await CosmosService.getUser({
        azureObjectId: azureObjectId,
        email: email
      });

      return user?.role || 'employee';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'employee';
    }
  }

  static async createUserProfile(userInfo) {
    const userProfile = {
      id: userInfo.azureObjectId, // Use Azure Object ID as primary key
      azureObjectId: userInfo.azureObjectId,
      email: userInfo.email,
      fullName: userInfo.name,
      role: 'employee',
      isApproved: false,
      department: '',
      createdAt: new Date().toISOString()
    };

    return await CosmosService.createUser(userProfile);
  }

  static async isUserApproved(azureObjectId) {
    const user = await CosmosService.getUser({ azureObjectId });
    return user?.isApproved || false;
  }
}
```

### 5. Update Authentication Layout

**File: `app/dashboard/layout.tsx`**
```typescript
'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserService } from '@/lib/azure-users';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn('azure-ad');
      return;
    }

    if (session?.user?.azureObjectId) {
      UserService.isUserApproved(session.user.azureObjectId)
        .then(setIsApproved);
    }
  }, [status, session, router]);

  if (status === 'loading' || isApproved === null) {
    return <div>Loading...</div>;
  }

  if (!isApproved) {
    router.push('/pending-approval');
    return null;
  }

  return (
    <div className="flex h-screen">
      {children}
    </div>
  );
}
```

### 6. Create Cosmos DB Service for Data Operations

**File: `lib/cosmos-service.js`**
```javascript
import { CosmosClient } from '@azure/cosmos';

class CosmosService {
  constructor() {
    this.client = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });
    this.database = this.client.database('BOH_Management');
  }

  async getUser(query) {
    try {
      const container = this.database.container('users');
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.azureObjectId = @objectId OR c.email = @email',
          parameters: [
            { name: '@objectId', value: query.azureObjectId },
            { name: '@email', value: query.email }
          ]
        })
        .fetchAll();

      return resources[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const container = this.database.container('users');
      const { resource } = await container.items.create(userData);
      return resource;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const container = this.database.container('users');
      const { resource } = await container.item(userId).replace(updateData);
      return resource;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}

export default new CosmosService();
```
```

### 7. Migration Checklist

**Firebase → Microsoft Entra ID Migration Tasks:**
- [ ] Set up Microsoft Entra ID (use existing organizational tenant)
- [ ] Register application in Microsoft Entra ID
- [ ] Configure redirect URIs and permissions
- [ ] Set up Azure Cosmos DB for application data
- [ ] Install and configure NextAuth.js with Entra ID provider
- [ ] Create user role management system with Cosmos DB
- [ ] Migrate user data to Cosmos DB with Azure Object IDs
- [ ] Update all authentication checks in components
- [ ] Test authentication flow with organizational accounts
- [ ] Update environment variables
- [ ] Deploy and test in production

### 8. Backward Compatibility

During migration, maintain both systems:
```javascript
// Dual authentication support
const getUser = async (session) => {
  // Try Microsoft Entra ID first
  if (session?.user?.azureObjectId) {
    const entraUser = await CosmosService.getUser({
      azureObjectId: session.user.azureObjectId
    });
    if (entraUser) return entraUser;
  }

  // Fallback to Firebase during transition
  return await getFirebaseUser();
};
```

### 9. Testing Strategy

1. **Unit Tests**: Authentication functions
2. **Integration Tests**: Login flow
3. **E2E Tests**: Complete user journey
4. **Security Tests**: Role-based access
5. **Performance Tests**: Login speed

### 10. Rollback Plan

If issues occur:
1. Switch environment variables back to Firebase
2. Disable Microsoft Entra ID authentication in NextAuth config
3. Re-enable Firebase auth
4. Monitor for issues
5. Fix problems and retry migration
6. Ensure Cosmos DB rollback plan if data was migrated

## Important Notes

⚠️ **Critical Correction**: This migration uses **Microsoft Entra ID** (organizational identity), NOT Azure AD B2C. B2C is for customer-facing applications, while Entra ID is for internal employee identity management.

⚠️ **Database Choice**: Azure Cosmos DB is recommended over SharePoint Lists for application data due to better performance, scalability, and query capabilities for high-volume operations.

⚠️ **Azure Object ID**: Always use the Azure AD Object ID (`profile.oid`) as the primary user identifier, as it's immutable and unique across the organization.