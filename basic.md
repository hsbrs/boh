[9 tools called]

Based on my exploration of your Operations Hub codebase, I've created a comprehensive diagram and explanation of how the system works. Here's what I found:

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OPERATIONS HUB - FIELD SERVICE MANAGEMENT         │
│                        (Broos Project FSM)                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼───────┐               ┌───────▼───────┐
            │   FRONTEND    │               │   BACKEND     │
            │   (Next.js)   │               │   (Firebase)  │
            └───────────────┘               └───────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │         CORE MODULES          │
                    └───────────────┬───────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
   ┌──────▼──────┐           ┌──────▼──────┐           ┌──────▼──────┐
   │  AUTH &     │           │  VACATION   │           │  PROJECT     │
   │  USER MGMT  │           │ MANAGEMENT  │           │ MANAGEMENT   │
   └─────────────┘           └─────────────┘           └─────────────┘
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │         SUPPORTING MODULES    │
                    └───────────────┬───────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
   ┌──────▼──────┐           ┌──────▼──────┐           ┌──────▼──────┐
   │   WEBGIS     │           │   REPORTS   │           │   ADMIN      │
   │ INTEGRATION │           │  & ANALYTICS│           │   PANEL      │
   └─────────────┘           └─────────────┘           └─────────────┘
```

## Detailed System Architecture

### **Frontend Layer (Next.js 15 + React 19 + TypeScript)**
```
User Browser → Next.js App Router → Dashboard Layout → Module Pages
                                      ↓
                             Authentication Check
                                      ↓
                         Role-Based Access Control
                                      ↓
                    Responsive UI (Tailwind + shadcn/ui)
```

### **Backend Layer (Firebase)**
```
Firebase Auth → Firestore Database → Real-time Updates
     ↓              ↓                       ↓
User Authentication  Data Storage        Live Sync
Role Management     Business Logic       Notifications
Security Rules      Query Optimization   Collaboration
```

## Core User Workflows

### **1. Authentication & Onboarding Flow**
```
New User → Registration → Email Verification → Admin Approval → Role Assignment → Dashboard Access
     ↓             ↓              ↓                ↓              ↓              ↓
Firebase Auth   Email Sent   Account Created   isApproved=true  User Role Set   Main Dashboard
```

### **2. Vacation Management Workflow (3-Tier Approval)**
```
Employee → Submit Request → HR Approval → PM Approval → Manager Approval → Final Status
   ↓             ↓              ↓             ↓              ↓              ↓
Form Fill    Status: Pending  Status: HR Review Status: PM Review Status: Approved/Denied
```

**Approval Chain Details:**
- **Employee**: Can submit, view, and delete own pending requests
- **HR**: Reviews initial requests (Pending → HR Review)  
- **Project Manager (PM)**: Reviews HR-approved requests (HR Review → PM Review)
- **Manager**: Gives final approval (PM Review → Approved/Denied)
- **Admin**: Can approve/reject at any stage

### **3. Dashboard Access Control**
```
User Login → Role Check → Permission Validation → Module Access
     ↓          ↓              ↓                   ↓
Auth State  Employee/HR/PM/  Route Guards       Available
Verified   Manager/Admin    Applied           Features
```

## Key System Components

### **User Roles & Permissions Matrix**
| Role | Vacation | Projects | WebGIS | Reports | Admin | User Mgmt |
|------|----------|----------|--------|---------|-------|-----------|
| **Employee** | Submit/View Own | Limited View | ❌ | ❌ | ❌ | ❌ |
| **HR** | Approve Initial | Team View | ❌ | View | ❌ | ❌ |
| **PM** | Approve 2nd Level | Full Management | ✅ | Generate | ❌ | ❌ |
| **Manager** | Final Approval | Oversight | ✅ | Full Access | ❌ | Team Mgmt |
| **Admin** | Full Access | System Control | ✅ | System Reports | ✅ | All Users |

### **Technology Stack Details**
- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui components
- **Backend**: Firebase (Auth + Firestore)
- **State Management**: React Hooks + Context
- **Real-time**: Firebase listeners for live updates
- **Responsive**: Mobile-first design with adaptive layouts

### **Data Flow Architecture**
```
User Action → Component Event → Firebase Call → Database Update → Real-time Listener → UI Update
     ↓              ↓              ↓              ↓                ↓              ↓
Button Click   onSubmit()     addDoc()       Document Saved    onSnapshot()    State Update
Form Submit    useState()     updateDoc()    Security Check    Live Sync       Re-render
```

## System Benefits for Operations

### **For Management:**
- **Complete Visibility**: Real-time dashboard showing all requests, approvals, and project status
- **Efficient Workflows**: Automated approval chains reduce manual coordination
- **Role-Based Oversight**: Each manager sees only relevant information
- **Performance Tracking**: Analytics and reporting for team productivity

### **For Employees:**
- **Self-Service**: Submit requests anytime without waiting for manager availability
- **Transparent Process**: Clear visibility into approval status and next steps
- **Mobile Access**: Responsive design works on all devices
- **Real-time Updates**: Instant notifications when requests are processed

### **For Administrators:**
- **User Lifecycle Management**: Complete control over user onboarding and permissions
- **System Monitoring**: Full visibility into all operations and workflows
- **Security Control**: Role-based access ensures data security
- **Scalability**: Firebase backend can handle growing user base

## Key Features Summary

1. **Multi-Role Authentication**: Secure login with granular permissions
2. **Vacation Workflow**: 3-tier approval system with audit trail
3. **Project Management**: City-based project tracking and management
4. **WebGIS Integration**: Geographic visualization of operational data
5. **Real-time Collaboration**: Live updates across all users
6. **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
7. **Admin Control Panel**: Complete system administration capabilities
8. **Analytics & Reporting**: Data-driven insights for decision making

This system provides a comprehensive solution for field service management with enterprise-grade features, secure authentication, and efficient workflows that scale with your organization's growth.