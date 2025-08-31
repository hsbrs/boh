# Development Guide

## Getting Started

This guide covers the development setup, workflow, and common tasks for the Broos Project FSM application.

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9.0 or later
- **Git** for version control
- **Firebase account** for backend services
- **Code editor** (VS Code recommended)

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ofsm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Get your configuration values from Project Settings

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
ofsm/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication
│   ├── pending-approval/ # User approval
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   └── Sidebar.tsx       # Navigation sidebar
├── lib/                   # Utilities and config
│   ├── firebase.js       # Firebase setup
│   └── utils.ts          # Utility functions
├── public/                # Static assets
├── components.json        # shadcn/ui config
├── next.config.ts         # Next.js config
├── tsconfig.json          # TypeScript config
├── tailwind.config.js     # Tailwind CSS config
└── package.json           # Dependencies
```

## Development Workflow

### 1. Creating New Pages

Create new pages in the `app/` directory following the App Router structure:

```typescript
// app/new-feature/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewFeaturePage() {
  const [data, setData] = useState('');

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>New Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Feature content goes here</p>
          <Button onClick={() => console.log(data)}>
            Action
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Creating New Components

Create reusable components in the `components/` directory:

```typescript
// components/FeatureCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  title: string;
  description: string;
  onAction?: () => void;
  className?: string;
}

export default function FeatureCard({
  title,
  description,
  onAction,
  className
}: FeatureCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{description}</p>
        {onAction && (
          <Button onClick={onAction} size="sm">
            Learn More
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. Adding New API Routes

Create new API routes in the `app/api/` directory:

```typescript
// app/api/feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'features'));
    const features: any[] = [];
    querySnapshot.forEach((doc) => {
      features.push({ id: doc.id, ...doc.data() });
    });
    
    return NextResponse.json(features);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const docRef = await addDoc(collection(db, 'features'), body);
    
    return NextResponse.json({ id: docRef.id, ...body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}
```

### 4. Adding New UI Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add switch
npx shadcn@latest add slider
npx shadcn@latest add progress
```

## Firebase Integration

### 1. Authentication

```typescript
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Sign in
const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign up
const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

// Sign out
const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Auth state listener
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      console.log('User:', user.uid);
    } else {
      // User is signed out
      console.log('No user');
    }
  });

  return () => unsubscribe();
}, []);
```

### 2. Firestore Operations

```typescript
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit 
} from 'firebase/firestore';

// Create document
const createDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Read document
const readDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error reading document:', error);
    throw error;
  }
};

// Update document
const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete document
const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Query documents
const queryDocuments = async (collectionName: string, conditions: any[] = []) => {
  try {
    let q = collection(db, collectionName);
    
    // Add where conditions
    conditions.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });
    
    // Add ordering
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const documents: any[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return documents;
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
};

// Usage examples
const getUsersByRole = async (role: string) => {
  return await queryDocuments('users', [
    { field: 'role', operator: '==', value: role }
  ]);
};

const getRecentProjects = async (limit: number = 10) => {
  let q = collection(db, 'projects');
  q = query(q, orderBy('createdAt', 'desc'), limit(limit));
  
  const querySnapshot = await getDocs(q);
  const projects: any[] = [];
  
  querySnapshot.forEach((doc) => {
    projects.push({ id: doc.id, ...doc.data() });
  });
  
  return projects;
};
```

## State Management

### 1. Local State with React Hooks

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';

export default function ExampleComponent() {
  // Basic state
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const filteredData = useMemo(() => {
    return data.filter(item => item.isActive);
  }, [data]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Side effects
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {filteredData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <Button onClick={handleRefresh}>Refresh</Button>
    </div>
  );
}
```

### 2. Custom Hooks

```typescript
// hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useFirestore<T>(
  collectionName: string,
  options: {
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    whereConditions?: Array<{ field: string; operator: any; value: any }>;
  } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let q = collection(db, collectionName);
    
    if (options.orderByField) {
      q = query(q, orderBy(options.orderByField, options.orderDirection || 'desc'));
    }
    
    if (options.whereConditions) {
      options.whereConditions.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents: T[] = [];
        snapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(documents);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, options.orderByField, options.orderDirection, options.whereConditions]);

  return { data, loading, error };
}

// Usage
const { data: users, loading, error } = useFirestore<User>('users', {
  orderByField: 'createdAt',
  orderDirection: 'desc'
});
```

## Form Handling

### 1. Basic Form with Validation

```typescript
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

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Submit form data
      await submitForm(formData);
      
      // Reset form
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
      
      // Show success message
      toast.success('Message sent successfully!');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <CardTitle>Contact Us</CardTitle>
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 2. Form with File Upload

```typescript
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FileUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file
      await uploadFile(formData);
      
      toast.success('File uploaded successfully!');
      setFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt"
          disabled={uploading}
        />
      </div>
      
      {file && (
        <div className="text-sm text-gray-600">
          Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </form>
  );
}
```

## Error Handling

### 1. Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="space-x-2">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Usage in layout
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Toast Notifications

```typescript
import { toast } from 'sonner';

// Success notification
toast.success('Operation completed successfully!');

// Error notification
toast.error('Something went wrong. Please try again.');

// Warning notification
toast.warning('Please check your input and try again.');

// Info notification
toast.info('New updates are available.');

// Custom notification
toast('Custom message', {
  description: 'Additional details here',
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo clicked')
  }
});
```

## Testing

### 1. Unit Testing with Jest

```typescript
// __tests__/utils.test.ts
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('base-class', 'another-class');
    expect(result).toBe('base-class another-class');
  });

  it('should handle conditional classes', () => {
    const condition = true;
    const result = cn('base-class', condition && 'conditional-class');
    expect(result).toBe('base-class conditional-class');
  });

  it('should handle falsy conditions', () => {
    const condition = false;
    const result = cn('base-class', condition && 'conditional-class');
    expect(result).toBe('base-class');
  });
});
```

### 2. Component Testing with React Testing Library

```typescript
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Performance Optimization

### 1. React.memo for Expensive Components

```typescript
import { memo } from 'react';

interface ExpensiveComponentProps {
  data: any[];
  onItemClick: (id: string) => void;
}

const ExpensiveComponent = memo<ExpensiveComponentProps>(({ data, onItemClick }) => {
  return (
    <div className="space-y-2">
      {data.map(item => (
        <div 
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className="p-2 border rounded cursor-pointer hover:bg-gray-50"
        >
          {item.name}
        </div>
      ))}
    </div>
  );
});

ExpensiveComponent.displayName = 'ExpensiveComponent';

export default ExpensiveComponent;
```

### 2. useMemo for Expensive Calculations

```typescript
import { useMemo } from 'react';

export default function DataTable({ data, filters }: { data: any[], filters: any }) {
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Expensive filtering logic
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key]?.toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // Expensive sorting logic
      return a.name.localeCompare(b.name);
    });
  }, [filteredData]);

  return (
    <div>
      {sortedData.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### 3. useCallback for Event Handlers

```typescript
import { useCallback } from 'react';

export default function ParentComponent() {
  const [items, setItems] = useState<any[]>([]);

  const handleItemClick = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, selected: !item.selected }
        : item
    ));
  }, []);

  const handleAddItem = useCallback((newItem: any) => {
    setItems(prev => [...prev, newItem]);
  }, []);

  return (
    <div>
      <AddItemForm onAdd={handleAddItem} />
      <ItemList items={items} onItemClick={handleItemClick} />
    </div>
  );
}
```

## Deployment

### 1. Build for Production

```bash
npm run build
```

### 2. Environment Variables for Production

Create `.env.production` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id
```

### 3. Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

### 4. Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

## Common Issues and Solutions

### 1. Firebase Configuration Errors

**Issue:** Firebase not initializing properly
**Solution:** Check environment variables and Firebase project settings

```typescript
// Add error handling to Firebase initialization
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}
```

### 2. TypeScript Errors

**Issue:** Type errors in components
**Solution:** Ensure proper type definitions

```typescript
// Always define interfaces for props
interface ComponentProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

// Use proper typing for event handlers
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

### 3. Styling Issues

**Issue:** Tailwind classes not working
**Solution:** Check Tailwind configuration and use `cn` utility

```typescript
import { cn } from '@/lib/utils';

// Use cn for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)}>
```

### 4. Build Errors

**Issue:** Build fails with module resolution errors
**Solution:** Clear cache and reinstall dependencies

```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

1. **Use TypeScript strict mode** for better type safety
2. **Implement proper error boundaries** for production
3. **Use React DevTools** for debugging
4. **Implement proper loading states** for better UX
5. **Use Firebase emulators** for local development
6. **Follow consistent naming conventions**
7. **Write meaningful commit messages**
8. **Test components in different screen sizes**
9. **Use proper semantic HTML** for accessibility
10. **Implement proper keyboard navigation**

---

This development guide covers the essential aspects of developing with the Broos Project FSM application. For more specific information, refer to the API documentation and component reference guides.