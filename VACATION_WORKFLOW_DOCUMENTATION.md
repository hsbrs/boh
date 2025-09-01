# Vacation Management System - Workflow Documentation

## Overview
The vacation management system implements a three-tier approval workflow where vacation requests must be approved by HR, Project Manager (PM), and Manager in sequence before being fully approved.

## Workflow Stages

### 1. Request Submission (`pending`)
- **Who**: Employee submits vacation request
- **Status**: `pending`
- **Next Action**: HR review required
- **Dashboard Display**: "Ausstehend" (Pending)

### 2. HR Review (`hr_review`)
- **Who**: HR approves the initial request
- **Status**: `hr_review`
- **Next Action**: PM review required
- **Dashboard Display**: "PM-Prüfung" (PM Review)

### 3. PM Review (`pm_review`)
- **Who**: Project Manager reviews HR-approved requests
- **Status**: `pm_review`
- **Next Action**: Manager review required
- **Dashboard Display**: "Manager-Prüfung" (Manager Review)

### 4. Final Approval (`approved`)
- **Who**: Manager gives final approval
- **Status**: `approved`
- **Next Action**: None - fully approved
- **Dashboard Display**: "Genehmigt" (Approved)

### 5. Rejection (`denied`)
- **Who**: Any approver can reject at any stage
- **Status**: `denied`
- **Next Action**: None - request terminated
- **Dashboard Display**: "Abgelehnt" (Denied)

## Data Structure

### Vacation Request Document
```typescript
interface VacationRequest {
  id: string;
  employeeId: string;           // Firebase UID of requesting employee
  employeeName: string;         // Display name of employee
  employeeRole: string;         // Role of employee (employee, hr, pm, manager, admin)
  startDate: Timestamp;         // Vacation start date
  endDate: Timestamp;           // Vacation end date
  reason: string;               // Reason for vacation
  replacementUserId?: string;   // UID of replacement person
  replacementUserName?: string; // Name of replacement person
  status: string;               // Current workflow status
  createdAt: Timestamp;         // Request creation timestamp
  updatedAt: Timestamp;         // Last update timestamp
  approvals: {
    hr: {
      approved: boolean;        // HR approval status
      date: Timestamp | null;   // Approval date (null if not acted)
      comment: string;          // HR comment
    };
    pm: {
      approved: boolean;        // PM approval status
      date: Timestamp | null;   // Approval date (null if not acted)
      comment: string;          // PM comment
    };
    manager: {
      approved: boolean;        // Manager approval status
      date: Timestamp | null;   // Approval date (null if not acted)
      comment: string;          // Manager comment
    };
  };
}
```

## Status Values

| Status | Description | German Display | Next Approver |
|--------|-------------|----------------|---------------|
| `pending` | Initial request submitted | "Ausstehend" | HR |
| `hr_review` | HR approved, waiting for PM | "PM-Prüfung" | PM |
| `pm_review` | PM approved, waiting for Manager | "Manager-Prüfung" | Manager |
| `approved` | Fully approved by all | "Genehmigt" | None |
| `denied` | Rejected by any approver | "Abgelehnt" | None |

## Dashboard Statistics Logic

### Pending Count Calculation
The "Ausstehend" (Pending) count includes all non-final statuses:
```typescript
pending: requests.filter((r: any) => 
  r.status === 'pending' || 
  r.status === 'hr_review' || 
  r.status === 'pm_review'
).length
```

This ensures that requests are counted as pending until they reach a final state (`approved` or `denied`).

## User Role Permissions

### Employee
- **Can**: Submit vacation requests, view own requests
- **Cannot**: Approve any requests
- **Sees**: Only their own vacation statistics

### HR
- **Can**: Approve/reject requests in `pending` status
- **Cannot**: Approve requests in other statuses
- **Sees**: All vacation requests for oversight

### Project Manager (PM)
- **Can**: Approve/reject requests in `hr_review` status
- **Cannot**: Approve requests in other statuses
- **Sees**: All vacation requests for oversight

### Manager
- **Can**: Approve/reject requests in `pm_review` status
- **Cannot**: Approve requests in other statuses
- **Sees**: All vacation requests for oversight

### Admin
- **Can**: Approve/reject requests at any stage
- **Sees**: All vacation requests for system oversight

## Approval History Display

The approval history shows all three roles with their current status:

### For Approved Roles
```
HR: Genehmigt - [comment if provided]
PM: Ausstehend
Manager: Ausstehend
```

### For Partially Approved Requests
```
HR: Genehmigt - no problem
PM: Ausstehend
Manager: Ausstehend
```

### For Fully Approved Requests
```
HR: Genehmigt - approved
PM: Genehmigt - looks good
Manager: Genehmigt - final approval
```

## Implementation Files

### Core Components
- `app/dashboard/vacation/page.tsx` - Main vacation dashboard
- `app/dashboard/vacation/VacationRequestList.tsx` - Request list and approval interface
- `app/dashboard/vacation/VacationRequestForm.tsx` - Request submission form
- `app/dashboard/page.tsx` - Main dashboard with vacation preview

### Key Functions

#### Status Calculation
```typescript
const fetchStats = (uid: string) => {
  // ... query setup ...
  const stats = {
    pending: requests.filter((r: any) => 
      r.status === 'pending' || r.status === 'hr_review' || r.status === 'pm_review'
    ).length,
    approved: requests.filter((r: any) => r.status === 'approved').length,
    denied: requests.filter((r: any) => r.status === 'denied').length,
    total: requests.length
  };
};
```

#### Approval Logic
```typescript
const canApprove = (request: VacationRequest) => {
  if (userRole === 'hr' && request.status === 'pending') return true;
  if (userRole === 'pm' && request.status === 'hr_review') return true;
  if (userRole === 'manager' && request.status === 'pm_review') return true;
  return false;
};

const getNextStatus = (request: VacationRequest) => {
  if (userRole === 'hr' && request.status === 'pending') return 'hr_review';
  if (userRole === 'pm' && request.status === 'hr_review') return 'pm_review';
  if (userRole === 'manager' && request.status === 'pm_review') return 'approved';
  return request.status;
};
```

## Future Improvements

### Potential Enhancements
1. **Email Notifications**: Send emails when requests need approval
2. **Calendar Integration**: Sync approved vacations with calendar systems
3. **Vacation Balance Tracking**: Track remaining vacation days per employee
4. **Bulk Operations**: Allow bulk approval/rejection of requests
5. **Advanced Filtering**: Filter requests by date range, employee, status
6. **Reporting**: Generate vacation reports and analytics
7. **Mobile App**: Native mobile app for vacation management
8. **Workflow Customization**: Allow different approval workflows per department
9. **Escalation Rules**: Automatic escalation if approvals are delayed
10. **Integration APIs**: REST APIs for external system integration

### Database Optimizations
1. **Indexing**: Add composite indexes for common queries
2. **Caching**: Implement caching for frequently accessed data
3. **Archiving**: Archive old vacation requests to improve performance
4. **Backup Strategy**: Implement automated backup for vacation data

### Security Considerations
1. **Role Validation**: Server-side validation of user roles
2. **Audit Trail**: Log all approval actions for compliance
3. **Data Encryption**: Encrypt sensitive vacation data
4. **Access Control**: Implement fine-grained access controls

## Testing Scenarios

### Test Cases
1. **Employee submits request** → Status: `pending`
2. **HR approves** → Status: `hr_review`, HR approval recorded
3. **PM approves** → Status: `pm_review`, PM approval recorded
4. **Manager approves** → Status: `approved`, Manager approval recorded
5. **Any role rejects** → Status: `denied`, rejection recorded
6. **Dashboard statistics** → Correct counts for all statuses
7. **Approval history** → Shows all roles with correct status

### Edge Cases
1. **Multiple requests by same employee**
2. **Overlapping vacation dates**
3. **Requests spanning multiple months**
4. **Role changes during approval process**
5. **System downtime during approval**

## Troubleshooting

### Common Issues
1. **Incorrect pending count**: Check status filter logic
2. **Missing approval history**: Verify approvals object structure
3. **Permission errors**: Check user role assignments
4. **Status not updating**: Verify Firestore update operations

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify Firestore security rules
3. Check user authentication status
4. Validate data structure in Firestore console
5. Test with different user roles

---

*Last Updated: [Current Date]*
*Version: 1.0*
