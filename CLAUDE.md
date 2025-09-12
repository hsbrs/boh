# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production 
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Component Management
- `npx shadcn@latest add [component]` - Add new shadcn/ui components

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **Backend**: Firebase (Auth, Firestore) 
- **Styling**: Tailwind CSS 4, shadcn/ui components (New York style)
- **Icons**: Lucide React

### Project Structure
- `app/` - Next.js App Router pages and layouts
  - `dashboard/` - Main application with role-based modules
  - `api/` - API routes for server-side logic
- `components/` - Reusable React components
  - `ui/` - shadcn/ui component library
  - `Sidebar.tsx` - Main navigation component
- `lib/` - Utilities and configurations
  - `firebase.js` - Firebase initialization and exports
  - `utils.ts` - Utility functions including cn() for className merging

### Key Architectural Patterns

**Role-Based Access Control**: The application implements a comprehensive 5-tier permission system with Firebase security rules:
- `employee` - Basic dashboard, vacation requests, limited task updates (status transitions and time tracking)
- `hr` - First-level vacation approval (pending → hr_review)  
- `pm` - Project management, WebGIS, reports, work orders, second-level vacation approval (hr_review → pm_review)
- `manager` - All PM permissions plus final vacation approval (pm_review → approved), full task management
- `admin` - Full system access including user management, deletion privileges, and override capabilities

**Vacation Approval Workflow**: Multi-stage approval process with deletion capabilities:
1. Employee creates request (pending) - can delete own pending requests
2. HR reviews and approves (hr_review) 
3. PM reviews and approves (pm_review)
4. Manager provides final approval (approved)
5. Any approver can reject at any stage (denied)

**Key Workflow Rules**:
- Employees can only delete requests in 'pending' status (before any approval)
- 'Pending' count includes all non-final statuses (pending, hr_review, pm_review)
- Replacement person selection is required for all vacation requests
- Real-time statistics show: total, pending (all non-final), approved, denied

**Task Management**: Role-specific permissions with field-level security:
- Employees can only update their assigned tasks with restricted status transitions (Planned → In Progress → Done)
- Employees can independently update actualStartTime, actualEndTime, and notes
- Managers/Admins have full CRUD access

**Firebase Integration**: 
- Authentication handled in `app/dashboard/layout.tsx` with real-time auth state
- User approval workflow redirects to `/pending-approval` for unapproved users
- User data stored in Firestore `users` collection with `role`, `fullName`, `isApproved` fields

**Responsive Sidebar**: Collapses automatically on mobile (`< 768px`) with smooth animations and tooltip support for collapsed state.

**Import Aliases**: TypeScript paths configured for clean imports:
- `@/components` - Components directory
- `@/lib` - Utilities and config
- `@/components/ui` - UI component library

### Firebase Configuration
Environment variables required in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` 
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Core Business Logic

**Vacation Statistics Calculation**:
```typescript
// Pending includes all non-final statuses
pending: requests.filter((r: any) => 
  r.status === 'pending' || r.status === 'hr_review' || r.status === 'pm_review'
).length
```

**Approval Permission Logic**:
```typescript
const canApprove = (request: VacationRequest) => {
  if (userRole === 'hr' && request.status === 'pending') return true;
  if (userRole === 'pm' && request.status === 'hr_review') return true;
  if (userRole === 'manager' && request.status === 'pm_review') return true;
  return false;
};
```

**Delete Permission Logic**:
```typescript
const canDelete = (request: VacationRequest) => {
  return userRole === 'employee' && 
         request.employeeId === userId && 
         request.status === 'pending';
};
```

### UI Component System
Uses shadcn/ui with:
- New York style variant
- CSS variables enabled
- Lucide icons
- Tailwind CSS 4 with neutral base color

## UI Enhancement Patterns

### Loading States System
- **Skeleton Components**: Professional animated loading states in `components/LoadingSkeletons.tsx` and `components/ui/skeleton.tsx`
- **Usage Pattern**: Replace static "Loading..." text with layout-aware skeleton placeholders
- **Animation**: Smooth pulse animations with `animate-pulse` and proper proportions

### Animation Enhancement Framework
- **Sidebar Animations**: 500ms smooth collapse/expand with rotating hamburger icons, text fade transitions
- **Card Animations**: Staggered entrance animations (fadeInUp, slideInLeft, slideInRight, scaleIn) with hover effects
- **Hover Patterns**: Multi-layer effects including scale (105%), vertical lift (-translate-y-1), shadow enhancement, and icon rotation (12°)
- **Color System**: Each card has dedicated color scheme with smooth transitions

### Dashboard Contextual Information
- **Real-Time Data Integration**: Live Firebase listeners for vacation stats, project metrics, and system statistics
- **Progress Indicators**: Animated progress bars showing completion rates, approval rates, and capacity utilization
- **Role-Based Display**: Different contextual information based on user permissions (employee/hr/pm/manager/admin)
- **Business Intelligence**: KPIs including project completion rates, geographic coverage, system efficiency metrics

### Standard Animation Timing
- **Entrance Animations**: 600ms ease-out
- **Hover Effects**: 300ms ease-in-out  
- **Progress Bars**: 1000ms ease-out
- **Micro-interactions**: 200ms for immediate feedback

## Vacation Management System Details

### Data Structure
**Vacation Request Document**:
```typescript
interface VacationRequest {
  id: string;
  employeeId: string;           // Firebase UID
  employeeName: string;         // Display name
  employeeRole: string;         // User role
  startDate: Timestamp;         // Vacation start
  endDate: Timestamp;           // Vacation end  
  reason: string;               // Vacation reason
  replacementUserId: string;    // Required replacement person UID
  replacementUserName: string;  // Required replacement person name
  status: 'pending' | 'hr_review' | 'pm_review' | 'approved' | 'denied';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvals: {
    hr: { approved: boolean; date: Timestamp | null; comment: string };
    pm: { approved: boolean; date: Timestamp | null; comment: string };
    manager: { approved: boolean; date: Timestamp | null; comment: string };
  };
}
```

### Status Display Mapping
- `pending` → "Ausstehend" (Pending)
- `hr_review` → "PM-Prüfung" (PM Review) 
- `pm_review` → "Manager-Prüfung" (Manager Review)
- `approved` → "Genehmigt" (Approved)
- `denied` → "Abgelehnt" (Denied)

## Component Architecture

### Responsive Design Implementation
- **Mobile-First**: All components use responsive breakpoints (sm:, md:, lg:)
- **Touch-Friendly**: Full-width buttons on mobile, adequate touch targets
- **Flexible Grids**: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` patterns
- **Responsive Typography**: `text-xs sm:text-sm`, `text-lg sm:text-xl` scaling
- **Icon Sizing**: `h-3 w-3 sm:h-4 sm:w-4` responsive icon dimensions

## Key Files for Development

- `components/Sidebar.tsx` - Main navigation with role-based menu items
- `app/dashboard/layout.tsx` - Authentication and user role management
- `app/dashboard/page.tsx` - Main dashboard with contextual information system
- `app/dashboard/vacation/page.tsx` - Main vacation management interface
- `app/dashboard/vacation/VacationRequestForm.tsx` - Vacation request submission
- `app/dashboard/vacation/VacationRequestList.tsx` - Request list and approvals
- `components/LoadingSkeletons.tsx` - Reusable loading state components
- `lib/firebase.js` - Firebase setup and configuration
- `components.json` - shadcn/ui configuration
- `app/globals.css` - Custom keyframe animations and utility classes