# Data Migration Plan: Firestore → SharePoint Lists

## Migration Strategy

### Data Mapping Overview
| Firestore Collection | SharePoint List | Migration Priority |
|---------------------|----------------|-------------------|
| users | Users | 1 (Critical) |
| vacation_requests | VacationRequests | 2 (High) |
| tasks | Tasks | 3 (Medium) |
| projects | Projects | 4 (Medium) |
| workOrders | WorkOrders | 5 (Low) |
| webgis | Files/Documents | 6 (Low) |
| reports | Reports | 7 (Low) |

## Phase 1: Users Collection Migration

### Current Firestore Structure
```json
{
  "id": "firebase-uid",
  "email": "user@company.com",
  "fullName": "John Doe",
  "role": "employee|hr|pm|manager|admin",
  "isApproved": true,
  "createdAt": "timestamp",
  "department": "IT"
}
```

### Target SharePoint Users List
```json
{
  "Title": "John Doe",
  "Email": "user@company.com",
  "Role": "employee",
  "IsApproved": true,
  "Department": "IT",
  "HireDate": "2023-01-15",
  "Manager": "manager@company.com",
  "AzureADObjectId": "azure-ad-object-id"
}
```

### Migration Script
```javascript
// File: scripts/migrate-users.js
import { collection, getDocs } from 'firebase/firestore';
import { GraphService } from '../lib/graph-service';

export async function migrateUsers() {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = [];

  usersSnapshot.forEach((doc) => {
    const userData = doc.data();
    users.push({
      Title: userData.fullName,
      Email: userData.email,
      Role: userData.role,
      IsApproved: userData.isApproved,
      Department: userData.department || '',
      HireDate: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      FirebaseUID: doc.id
    });
  });

  for (const user of users) {
    try {
      await GraphService.createListItem('Users', user);
      console.log(`Migrated user: ${user.Email}`);
    } catch (error) {
      console.error(`Failed to migrate user ${user.Email}:`, error);
    }
  }
}
```

## Phase 2: Vacation Requests Migration

### Current Firestore Structure
```json
{
  "employeeId": "firebase-uid",
  "employeeName": "John Doe",
  "startDate": "timestamp",
  "endDate": "timestamp",
  "reason": "Personal vacation",
  "replacementUserId": "replacement-uid",
  "status": "pending",
  "approvals": {
    "hr": { "approved": false, "date": null, "comment": "" },
    "pm": { "approved": false, "date": null, "comment": "" },
    "manager": { "approved": false, "date": null, "comment": "" }
  }
}
```

### Target SharePoint VacationRequests List
```json
{
  "Title": "John Doe - Jan 15-20, 2024",
  "Employee": "john.doe@company.com",
  "StartDate": "2024-01-15",
  "EndDate": "2024-01-20",
  "Reason": "Personal vacation",
  "ReplacementPerson": "jane.smith@company.com",
  "Status": "Pending",
  "HRApproval": false,
  "PMApproval": false,
  "ManagerApproval": false,
  "Comments": "Multi-line text field",
  "CreatedDate": "2024-01-01",
  "ModifiedDate": "2024-01-01"
}
```

## Phase 3: Tasks Migration

### SharePoint Tasks List Structure
```json
{
  "Title": "Complete project documentation",
  "AssignedTo": "user@company.com",
  "Status": "In Progress",
  "Priority": "Medium",
  "StartDate": "2024-01-15",
  "EndDate": "2024-01-20",
  "ActualStartTime": "2024-01-15T09:00:00Z",
  "ActualEndTime": null,
  "Notes": "Working on technical specifications",
  "Project": "Project Alpha"
}
```

## SharePoint List Creation Scripts

### Create Lists via PowerShell
```powershell
# Connect to SharePoint
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/boh-management" -Interactive

# Create Users List
$usersTemplate = @{
  Title = "Users"
  Template = 100  # Custom List
}
New-PnPList @usersTemplate

# Add columns to Users list
Add-PnPField -List "Users" -DisplayName "Email" -InternalName "Email" -Type Text -Required
Add-PnPField -List "Users" -DisplayName "Role" -InternalName "Role" -Type Choice -Choices @("employee","hr","pm","manager","admin") -Required
Add-PnPField -List "Users" -DisplayName "IsApproved" -InternalName "IsApproved" -Type Boolean -Required
Add-PnPField -List "Users" -DisplayName "Department" -InternalName "Department" -Type Text
Add-PnPField -List "Users" -DisplayName "HireDate" -InternalName "HireDate" -Type DateTime
```

### Create Lists via Graph API
```javascript
// File: scripts/create-sharepoint-lists.js
import { GraphService } from '../lib/graph-service';

export async function createSharePointLists() {
  const lists = [
    {
      displayName: 'Users',
      description: 'User management and roles',
      template: 'genericList',
      columns: [
        { name: 'Email', text: {} },
        { name: 'Role', choice: { choices: ['employee', 'hr', 'pm', 'manager', 'admin'] } },
        { name: 'IsApproved', boolean: {} },
        { name: 'Department', text: {} },
        { name: 'HireDate', dateTime: {} }
      ]
    },
    {
      displayName: 'VacationRequests',
      description: 'Vacation request management',
      template: 'genericList',
      columns: [
        { name: 'Employee', text: {} },
        { name: 'StartDate', dateTime: {} },
        { name: 'EndDate', dateTime: {} },
        { name: 'Reason', text: { maxLength: 500 } },
        { name: 'ReplacementPerson', text: {} },
        { name: 'Status', choice: { choices: ['pending', 'hr_review', 'pm_review', 'approved', 'denied'] } },
        { name: 'HRApproval', boolean: {} },
        { name: 'PMApproval', boolean: {} },
        { name: 'ManagerApproval', boolean: {} }
      ]
    }
  ];

  for (const listConfig of lists) {
    await GraphService.createList(listConfig);
  }
}
```

## Data Validation & Integrity

### Validation Scripts
```javascript
// File: scripts/validate-migration.js
export async function validateMigration() {
  // Count records in Firestore
  const firebaseUserCount = await getFirestoreCount('users');
  const firebaseVacationCount = await getFirestoreCount('vacation_requests');

  // Count records in SharePoint
  const sharepointUserCount = await getSharePointCount('Users');
  const sharepointVacationCount = await getSharePointCount('VacationRequests');

  console.log('Migration Validation:');
  console.log(`Users: Firebase ${firebaseUserCount} → SharePoint ${sharepointUserCount}`);
  console.log(`Vacations: Firebase ${firebaseVacationCount} → SharePoint ${sharepointVacationCount}`);
}
```

## Migration Execution Plan

### Pre-Migration Steps
1. **Backup Firestore Data**
   ```bash
   gcloud firestore export gs://your-backup-bucket/firestore-backup
   ```

2. **Create SharePoint Lists**
   ```bash
   node scripts/create-sharepoint-lists.js
   ```

3. **Test Migration Script**
   ```bash
   node scripts/test-migration.js
   ```

### Migration Execution
1. **Users (Critical)**
   ```bash
   node scripts/migrate-users.js
   ```

2. **Vacation Requests**
   ```bash
   node scripts/migrate-vacation-requests.js
   ```

3. **Tasks and Projects**
   ```bash
   node scripts/migrate-tasks.js
   node scripts/migrate-projects.js
   ```

### Post-Migration Validation
1. **Data Integrity Check**
   ```bash
   node scripts/validate-migration.js
   ```

2. **Functional Testing**
   - Test user authentication
   - Test vacation request creation
   - Test role-based permissions

## Rollback Strategy

### If Migration Fails
1. **Keep Firestore Active**: Don't delete Firestore data until migration is verified
2. **Environment Variables**: Switch back to Firebase config
3. **Database Abstraction**: Use service layer to switch between backends
4. **Gradual Migration**: Migrate one collection at a time

### Dual Operation Period
During migration, support both systems:
```javascript
// File: lib/data-service.js
export class DataService {
  static async getUser(id) {
    if (process.env.USE_SHAREPOINT === 'true') {
      return await SharePointService.getUser(id);
    }
    return await FirebaseService.getUser(id);
  }
}
```

## Performance Considerations

### Batch Operations
- Migrate in batches of 100-500 records
- Add delays between batches to avoid throttling
- Monitor SharePoint API limits

### Indexing
- Create indexes on frequently queried fields
- Use SharePoint views for complex queries

### Caching
- Implement caching layer for frequently accessed data
- Use Redis or in-memory cache for session data