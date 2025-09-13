# Authentication Migration: Firebase → Azure AD

## Migration Overview

### Current Firebase Authentication
- Email/password authentication
- Role-based access control (employee, hr, pm, manager, admin)
- User approval workflow
- Custom claims for roles

### Target Azure AD B2C
- Enterprise single sign-on (SSO)
- Multi-factor authentication (MFA)
- Social logins (optional)
- Role-based access with Azure AD groups

## Implementation Steps

### 1. Install Required Packages
```bash
npm install @azure/msal-browser @azure/msal-react
npm install next-auth
npm install @next-auth/azure-ad-provider
```

### 2. Create Azure AD Configuration

**File: `lib/azure-config.js`**
```javascript
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

export const loginRequest = {
  scopes: ["User.Read", "Sites.ReadWrite.All"],
};
```

### 3. Replace Firebase Auth with NextAuth

**File: `app/api/auth/[...nextauth]/route.js`**
```javascript
import NextAuth from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.role = await getUserRole(profile.email)
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.role = token.role
      return session
    }
  }
})

export { handler as GET, handler as POST }
```

### 4. Create User Role Management

**File: `lib/azure-users.js`**
```javascript
import { GraphService } from './graph-service';

export class UserService {
  static async getUserRole(email) {
    try {
      // Get user from SharePoint Users list
      const user = await GraphService.getListItem('users',
        `fields/Email eq '${email}'`);

      return user?.fields?.Role || 'employee';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'employee';
    }
  }

  static async createUserProfile(userInfo) {
    const userProfile = {
      Title: userInfo.name,
      Email: userInfo.email,
      Role: 'employee',
      IsApproved: false,
      Department: '',
      HireDate: new Date().toISOString()
    };

    return await GraphService.createListItem('users', userProfile);
  }

  static async isUserApproved(email) {
    const user = await GraphService.getListItem('users',
      `fields/Email eq '${email}'`);

    return user?.fields?.IsApproved || false;
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

    if (session?.user?.email) {
      UserService.isUserApproved(session.user.email)
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

### 6. Create Graph Service for API Calls

**File: `lib/graph-service.js`**
```javascript
import { Client } from '@microsoft/microsoft-graph-client';

export class GraphService {
  static getClient(accessToken) {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  static async getListItem(listName, filter = '') {
    const client = this.getClient(process.env.GRAPH_ACCESS_TOKEN);

    try {
      const response = await client
        .api(`/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${listName}/items`)
        .filter(filter)
        .expand('fields')
        .get();

      return response.value[0] || null;
    } catch (error) {
      console.error(`Error getting ${listName} item:`, error);
      throw error;
    }
  }

  static async createListItem(listName, fields) {
    const client = this.getClient(process.env.GRAPH_ACCESS_TOKEN);

    try {
      const response = await client
        .api(`/sites/${process.env.SHAREPOINT_SITE_ID}/lists/${listName}/items`)
        .post({
          fields
        });

      return response;
    } catch (error) {
      console.error(`Error creating ${listName} item:`, error);
      throw error;
    }
  }
}
```

### 7. Migration Checklist

**Firebase → Azure AD Migration Tasks:**
- [ ] Set up Azure AD B2C tenant
- [ ] Register application in Azure AD
- [ ] Configure redirect URIs and permissions
- [ ] Install and configure NextAuth.js
- [ ] Create user role management system
- [ ] Migrate user data to SharePoint Users list
- [ ] Update all authentication checks in components
- [ ] Test authentication flow
- [ ] Update environment variables
- [ ] Deploy and test in production

### 8. Backward Compatibility

During migration, maintain both systems:
```javascript
// Dual authentication support
const getUser = async () => {
  // Try Azure AD first
  const azureUser = await getAzureUser();
  if (azureUser) return azureUser;

  // Fallback to Firebase
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
2. Disable Azure AD authentication
3. Re-enable Firebase auth
4. Monitor for issues
5. Fix problems and retry migration