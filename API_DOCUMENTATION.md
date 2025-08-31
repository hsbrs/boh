# Broos Project FSM - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Core Libraries](#core-libraries)
4. [Authentication & User Management](#authentication--user-management)
5. [UI Components](#ui-components)
6. [Layout Components](#layout-components)
7. [API Routes](#api-routes)
8. [Utility Functions](#utility-functions)
9. [Configuration](#configuration)
10. [Usage Examples](#usage-examples)

## Overview

Broos Project FSM is a comprehensive project management application built with Next.js 15, TypeScript, and Firebase. The application provides role-based access control, real-time project tracking, team collaboration, and analytics capabilities.

**Key Features:**
- User authentication and authorization
- Role-based access control (Employee, Manager, Admin)
- Project management and task tracking
- Warehouse management
- Vacation management
- WebGIS integration
- Real-time collaboration tools
- Responsive dashboard interface

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard pages
│   ├── login/            # Authentication pages
│   ├── pending-approval/ # User approval workflow
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── Sidebar.tsx       # Main navigation sidebar
├── lib/                   # Utility libraries
│   ├── firebase.js       # Firebase configuration
│   └── utils.ts          # Utility functions
└── public/                # Static assets
```

## Core Libraries

### Dependencies
- **Next.js 15.4.7** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety
- **Firebase 12.1.0** - Backend services
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI

### Key Libraries
- **@radix-ui/react-*** - Accessible UI primitives
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility
- **tailwind-merge** - Tailwind class merging
- **lucide-react** - Icon library
- **date-fns** - Date manipulation utilities

## Authentication & User Management

### Firebase Configuration

**File:** `lib/firebase.js`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
```

**Environment Variables Required:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### User Roles & Permissions

The application supports three user roles with different access levels:

1. **Employee** (`role: 'employee'`)
   - Basic dashboard access
   - Task management
   - Vacation requests
   - Limited project access

2. **Manager** (`role: 'manager'`)
   - All employee permissions
   - Team management
   - Project oversight
   - Warehouse management
   - Report generation

3. **Admin** (`role: 'admin'`)
   - All manager permissions
   - User approval system
   - System configuration
   - Full access to all modules

### User Data Structure

```typescript
interface User {
  uid: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  fullName: string;
  jobTitle: string;
  phoneNumber: string;
  isApproved: boolean;
  createdAt: Date;
}
```

## UI Components

### Button Component

**File:** `components/ui/button.tsx`

A versatile button component with multiple variants and sizes.

```typescript
import { Button, buttonVariants } from '@/components/ui/button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="link">Link</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

// As child (for links)
<Button asChild>
  <Link href="/dashboard">Dashboard</Link>
</Button>

// Custom styling
<Button className="bg-blue-500 hover:bg-blue-600">
  Custom Button
</Button>
```

**Variants:**
- `default` - Primary button with primary colors
- `destructive` - Red button for dangerous actions
- `outline` - Bordered button with transparent background
- `secondary` - Secondary button with muted colors
- `ghost` - Transparent button with hover effects
- `link` - Text button that looks like a link

**Sizes:**
- `sm` - Small button (h-8, px-3)
- `default` - Standard button (h-9, px-4)
- `lg` - Large button (h-10, px-6)
- `icon` - Square button for icons (size-9)

### Card Component

**File:** `components/ui/card.tsx`

A flexible card component for displaying content in containers.

```typescript
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardAction 
} from '@/components/ui/card';

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Card with action button
<Card>
  <CardHeader>
    <CardTitle>Project Card</CardTitle>
    <CardDescription>Project description</CardDescription>
    <CardAction>
      <Button size="sm">Edit</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    Project details...
  </CardContent>
</Card>
```

**Card Subcomponents:**
- `Card` - Main container
- `CardHeader` - Header section with title and description
- `CardTitle` - Card title text
- `CardDescription` - Card description text
- `CardContent` - Main content area
- `CardFooter` - Footer section for actions
- `CardAction` - Action button positioned in header

### Input Component

**File:** `components/ui/input.tsx`

A styled input component for forms.

```typescript
import { Input } from '@/components/ui/input';

// Basic input
<Input type="email" placeholder="Enter your email" />

// With label
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Controlled input
<Input 
  value={email} 
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Email address"
/>
```

### Label Component

**File:** `components/ui/label.tsx`

Accessible label component for form inputs.

```typescript
import { Label } from '@/components/ui/label';

<Label htmlFor="username">Username</Label>
<Input id="username" />

// With required indicator
<Label htmlFor="email">
  Email <span className="text-red-500">*</span>
</Label>
```

### Badge Component

**File:** `components/ui/badge.tsx`

A badge component for displaying status, tags, or labels.

```typescript
import { Badge } from '@/components/ui/badge';

// Basic badge
<Badge>Default</Badge>

// With variants
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Custom styling
<Badge className="bg-green-500 text-white">
  Success
</Badge>
```

### Dialog Component

**File:** `components/ui/dialog.tsx`

A modal dialog component for overlays and popups.

```typescript
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    <div>Dialog content goes here</div>
  </DialogContent>
</Dialog>
```

### Select Component

**File:** `components/ui/select.tsx`

A select dropdown component for choosing from options.

```typescript
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Table Component

**File:** `components/ui/table.tsx`

A table component for displaying tabular data.

```typescript
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Manager</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs Component

**File:** `components/ui/tabs.tsx`

A tabs component for organizing content into sections.

```typescript
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account settings content
  </TabsContent>
  <TabsContent value="password">
    Password change content
  </TabsContent>
</Tabs>
```

### Calendar Component

**File:** `components/ui/calendar.tsx`

A calendar component for date selection.

```typescript
import { Calendar } from '@/components/ui/calendar';

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  className="rounded-md border"
/>
```

### Tooltip Component

**File:** `components/ui/tooltip.tsx`

A tooltip component for displaying additional information.

```typescript
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Separator Component

**File:** `components/ui/separator.tsx`

A visual separator component.

```typescript
import { Separator } from '@/components/ui/separator';

// Horizontal separator
<Separator />

// Vertical separator
<Separator orientation="vertical" />

// Custom styling
<Separator className="my-4" />
```

### Popover Component

**File:** `components/ui/popover.tsx`

A popover component for floating content.

```typescript
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button>Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    <div>Popover content</div>
  </PopoverContent>
</Popover>
```

### Scroll Area Component

**File:** `components/ui/scroll-area.tsx`

A custom scrollable area component.

```typescript
import { ScrollArea } from '@/components/ui/scroll-area';

<ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
  <div className="space-y-4">
    {/* Scrollable content */}
  </div>
</ScrollArea>
```

### Resizable Component

**File:** `components/ui/resizable.tsx`

A resizable panel component.

```typescript
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={50}>
    <div>Left panel</div>
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={50}>
    <div>Right panel</div>
  </ResizablePanel>
</ResizablePanelGroup>
```

### Sonner Component

**File:** `components/ui/sonner.tsx`

A toast notification component.

```typescript
import { Toaster } from '@/components/ui/sonner';

// Add to your layout
<Toaster />

// Usage in components
import { toast } from 'sonner';

toast('Event has been created');
toast.success('Success message');
toast.error('Error message');
```

## Layout Components

### Root Layout

**File:** `app/layout.tsx`

The root layout component that wraps all pages.

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Broos Project FSM",
  description: "Created by Hady Safaei",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**Features:**
- Google Fonts integration (Geist Sans & Geist Mono)
- CSS variables for font families
- Antialiased text rendering
- Responsive design support

### Dashboard Layout

**File:** `app/dashboard/layout.tsx`

The main dashboard layout with authentication and navigation.

```typescript
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // State management for user authentication
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  // Authentication logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        // Fetch user data and check approval status
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
          setUserName(userData.fullName);
          setIsApproved(userData.isApproved);
          
          if (userData.isApproved === false) {
            router.push('/pending-approval');
            return;
          }
        }
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      if (error instanceof Error) {
        alert('Fehler beim Abmelden: ' + error.message);
      } else {
        alert('Ein unbekannter Fehler ist aufgetreten.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {showSidebar && (
        <Sidebar
          isCollapsed={isCollapsed}
          userRole={userRole}
          userName={userName}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onLogout={handleLogout}
        />
      )}
      {children}
    </div>
  );
}
```

**Features:**
- Firebase authentication integration
- User role and approval checking
- Responsive sidebar behavior
- Automatic redirects for unauthenticated users
- Logout functionality

### Sidebar Component

**File:** `components/Sidebar.tsx`

The main navigation sidebar with role-based menu items.

```typescript
interface SidebarProps {
  isCollapsed: boolean;
  userRole: string | null;
  userName: string | null;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  isCollapsed, 
  userRole, 
  userName, 
  onToggleCollapse, 
  onLogout 
}: SidebarProps) {
  const [isWarehouseExpanded, setIsWarehouseExpanded] = useState(false);
  const isManagerOrAdmin = userRole === 'manager' || userRole === 'admin';
  const isAdmin = userRole === 'admin';

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className={cn(
      'flex flex-col min-h-screen bg-white shadow-lg transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-20 p-2' : 'w-64 p-6'
    )}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {!isCollapsed && (
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={isCollapsed ? 'w-full' : ''}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <Separator />
      
      {/* Navigation Menu */}
      <div className="flex-1 mt-6">
        <nav className="flex flex-col space-y-2">
          {/* Menu items with role-based visibility */}
        </nav>
      </div>
      
      {/* User Profile Section */}
      <div className="mt-auto">
        <Separator className="mb-4" />
        <div className="flex items-center space-x-3">
          {/* User avatar and info */}
        </div>
      </div>
    </div>
  );
}
```

**Features:**
- Collapsible sidebar with smooth animations
- Role-based menu visibility
- Tooltips for collapsed state
- User profile display
- Responsive design
- German language support

**Menu Structure:**
- **Startseite** (Dashboard) - All users
- **Arbeitsaufträge** (Tasks) - All users
- **Projekte** (Projects) - All users
- **Lagerverwaltung** (Warehouse) - Manager/Admin only
- **Urlaubsverwaltung** (Vacation) - All users
- **WebGIS** - All users
- **Diskussion** (Discussion) - All users
- **Berichte** (Reports) - Manager/Admin only
- **Admin** - Admin only

## API Routes

### User API

**File:** `app/api/user/[uid]/route.ts`

API endpoint for fetching user information.

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  
  try {
    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      uid: userData.uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      jobTitle: userData.jobTitle,
      phoneNumber: userData.phoneNumber,
      isApproved: userData.isApproved
    });

  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

**Endpoint:** `GET /api/user/[uid]`

**Parameters:**
- `uid` (path parameter) - User ID to fetch

**Response:**
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "manager",
  "jobTitle": "Project Manager",
  "phoneNumber": "+1234567890",
  "isApproved": true
}
```

**Error Responses:**
- `400` - User ID is required
- `404` - User not found
- `500` - Internal server error

## Utility Functions

### CN Utility

**File:** `lib/utils.ts`

A utility function for merging CSS classes with Tailwind CSS.

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage:**
```typescript
import { cn } from "@/lib/utils";

// Merge multiple classes
const className = cn(
  "base-class",
  condition && "conditional-class",
  "another-class"
);

// Example with conditional styling
<Button className={cn(
  "base-button",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50"
)}>
  Click me
</Button>
```

**Features:**
- Combines `clsx` for conditional classes
- Uses `tailwind-merge` for Tailwind CSS optimization
- Prevents duplicate classes
- Maintains proper class ordering

## Configuration

### Next.js Configuration

**File:** `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

### TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind CSS Configuration

**File:** `postcss.config.mjs`

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### shadcn/ui Configuration

**File:** `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

## Usage Examples

### Creating a New Page

```typescript
// app/new-page/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewPage() {
  const [value, setValue] = useState('');

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>New Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="input">Input Label</Label>
              <Input 
                id="input" 
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
              />
            </div>
            <Button onClick={() => console.log(value)}>
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Creating a Custom Component

```typescript
// components/CustomComponent.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CustomComponentProps {
  title: string;
  className?: string;
  onAction?: () => void;
}

export default function CustomComponent({ 
  title, 
  className, 
  onAction 
}: CustomComponentProps) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={cn(
      "p-4 border rounded-lg",
      isActive && "bg-blue-50 border-blue-200",
      className
    )}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <Button 
        onClick={() => {
          setIsActive(!isActive);
          onAction?.();
        }}
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>
    </div>
  );
}
```

### Using Firebase in Components

```typescript
// components/FirebaseExample.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataItem {
  id: string;
  name: string;
  description: string;
}

export default function FirebaseExample() {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'collection-name'));
        const items: DataItem[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as DataItem);
        });
        setData(items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Form Handling with Validation

```typescript
// components/FormExample.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function FormExample() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Form is valid, proceed with submission
      console.log('Form data:', formData);
      // Add your submission logic here
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contact Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              className={errors.message ? 'border-red-500' : ''}
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### Component Design
1. **Use TypeScript interfaces** for all component props
2. **Implement proper error handling** in async operations
3. **Use the `cn` utility** for conditional class names
4. **Follow the single responsibility principle** for components
5. **Implement proper loading states** for async operations

### State Management
1. **Use React hooks** for local state management
2. **Implement proper cleanup** in useEffect hooks
3. **Use Firebase listeners** for real-time data
4. **Handle authentication state** properly

### Styling
1. **Use Tailwind CSS utilities** for consistent styling
2. **Implement responsive design** with mobile-first approach
3. **Use CSS variables** for theme customization
4. **Maintain consistent spacing** with Tailwind's spacing scale

### Security
1. **Validate user input** on both client and server
2. **Implement proper authentication** checks
3. **Use Firebase security rules** for database access
4. **Sanitize user data** before display

### Performance
1. **Implement proper loading states** to improve perceived performance
2. **Use React.memo** for expensive components
3. **Optimize Firebase queries** with proper indexing
4. **Implement proper error boundaries** for error handling

## Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Check environment variables are properly set
   - Verify Firebase project configuration
   - Ensure proper Firebase initialization

2. **Component Styling Issues**
   - Verify Tailwind CSS is properly configured
   - Check for CSS class conflicts
   - Use the `cn` utility for conditional classes

3. **TypeScript Errors**
   - Ensure proper type definitions
   - Check import/export statements
   - Verify interface implementations

4. **Build Errors**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `npm install`
   - Check for syntax errors in components

### Getting Help

1. **Check the console** for error messages
2. **Review Firebase documentation** for authentication issues
3. **Consult shadcn/ui documentation** for component usage
4. **Review Next.js documentation** for framework-specific issues

---

This documentation covers all the public APIs, functions, and components in the Broos Project FSM application. For additional support or questions, please refer to the individual component files or consult the project maintainers.