# Data Migration Plan: Firestore → Azure Cosmos DB

## Migration Strategy

### Data Mapping Overview
| Firestore Collection | Cosmos DB Container | Migration Priority | Notes |
|---------------------|-------------------|-------------------|-------|
| users | users | 1 (Critical) | Add azureObjectId field |
| vacation_requests | vacationRequests | 2 (High) | Enhanced with approval workflow |
| tasks | tasks | 3 (Medium) | Link to projects container |
| projects | projects | 4 (Medium) | Enhanced project management |
| workOrders | workOrders | 5 (Low) | Geographic and file references |
| webgis | webgisData | 6 (Low) | Geographic data + SharePoint files |
| reports | reports | 7 (Low) | Reporting metadata + Power BI |

**Note**: For large files and documents, use SharePoint document libraries with references stored in Cosmos DB.

⚠️ **Critical Update**: Azure Cosmos DB is the recommended database solution instead of SharePoint Lists for better performance, scalability, and query capabilities for high-volume data operations.

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

### Target Cosmos DB Users Container
```json
{
  "id": "azure-ad-object-id",  // Primary key
  "azureObjectId": "azure-ad-object-id",  // Immutable identifier
  "email": "user@company.com",
  "fullName": "John Doe",
  "role": "employee",
  "isApproved": true,
  "department": "IT",
  "hireDate": "2023-01-15T00:00:00.000Z",
  "managerId": "manager-azure-object-id",
  "firebaseUid": "original-firebase-uid",  // For migration reference
  "createdAt": "2023-01-15T00:00:00.000Z",
  "updatedAt": "2023-01-15T00:00:00.000Z",
  "_ts": 1642204800  // Cosmos DB timestamp
}
```

### Migration Script
```javascript
// File: scripts/migrate-users.js
import { collection, getDocs } from 'firebase/firestore';
import CosmosService from '../lib/cosmos-service';
import { GraphService } from '../lib/graph-service';

export async function migrateUsers() {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const users = [];
  const migrationErrors = [];

  // First pass: collect and transform data
  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();

    try {
      // Look up Azure Object ID using Microsoft Graph API
      const azureUser = await GraphService.getUserByEmail(userData.email);

      if (!azureUser) {
        console.warn(`No Azure AD user found for email: ${userData.email}`);
        migrationErrors.push({
          email: userData.email,
          error: 'No Azure AD user found'
        });
        continue;
      }

      users.push({
        id: azureUser.id, // Use Azure Object ID as primary key
        azureObjectId: azureUser.id,
        email: userData.email,
        fullName: userData.fullName || azureUser.displayName,
        role: userData.role || 'employee',
        isApproved: userData.isApproved || false,
        department: userData.department || azureUser.department || '',
        hireDate: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        firebaseUid: doc.id, // Keep for reference during migration
        createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error processing user ${userData.email}:`, error);
      migrationErrors.push({
        email: userData.email,
        error: error.message
      });
    }
  }

  // Second pass: create users in Cosmos DB
  for (const user of users) {
    try {
      await CosmosService.createUser(user);
      console.log(`✅ Migrated user: ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${user.email}:`, error);
      migrationErrors.push({
        email: user.email,
        error: error.message
      });
    }
  }

  // Report migration results
  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ Successfully migrated: ${users.length - migrationErrors.length} users`);
  console.log(`❌ Failed migrations: ${migrationErrors.length} users`);

  if (migrationErrors.length > 0) {
    console.log('\n❌ Migration Errors:');
    migrationErrors.forEach(error => {
      console.log(`  - ${error.email}: ${error.error}`);
    });
  }

  return {
    successful: users.length - migrationErrors.length,
    failed: migrationErrors.length,
    errors: migrationErrors
  };
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

### Target Cosmos DB VacationRequests Container
```json
{
  "id": "unique-vacation-request-id",
  "employeeId": "azure-object-id",
  "employeeName": "John Doe",
  "employeeEmail": "john.doe@company.com",
  "employeeRole": "employee",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-20T23:59:59.999Z",
  "dayCount": 5,
  "reason": "Personal vacation",
  "replacementUserId": "replacement-azure-object-id",
  "replacementUserName": "Jane Smith",
  "replacementUserEmail": "jane.smith@company.com",
  "status": "pending",
  "approvals": {
    "hr": {
      "approved": false,
      "approverId": null,
      "approverName": null,
      "date": null,
      "comment": ""
    },
    "pm": {
      "approved": false,
      "approverId": null,
      "approverName": null,
      "date": null,
      "comment": ""
    },
    "manager": {
      "approved": false,
      "approverId": null,
      "approverName": null,
      "date": null,
      "comment": ""
    }
  },
  "calendarEventId": null,
  "teamsNotificationId": null,
  "firebaseId": "original-firebase-id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "_ts": 1642204800
}
```

## Phase 3: Tasks Migration

### Cosmos DB Tasks Container Structure
```json
{
  "id": "unique-task-id",
  "title": "Complete project documentation",
  "description": "Create comprehensive technical documentation",
  "assigneeUid": "azure-object-id",
  "assigneeName": "John Doe",
  "assigneeEmail": "john.doe@company.com",
  "projectId": "project-id",
  "projectName": "Project Alpha",
  "status": "In Progress",
  "priority": "Medium",
  "plannedStartTime": "2024-01-15T09:00:00.000Z",
  "plannedEndTime": "2024-01-20T17:00:00.000Z",
  "actualStartTime": "2024-01-15T09:00:00.000Z",
  "actualEndTime": null,
  "estimatedHours": 40,
  "actualHours": 0,
  "notes": "Working on technical specifications",
  "tags": ["documentation", "technical"],
  "firebaseId": "original-firebase-task-id",
  "createdAt": "2024-01-15T00:00:00.000Z",
  "updatedAt": "2024-01-15T00:00:00.000Z",
  "_ts": 1642204800
}
```

## Azure Cosmos DB Setup Scripts

### Create Database and Containers
```javascript
// File: scripts/setup-cosmos-db.js
import { CosmosClient } from '@azure/cosmos';

export async function setupCosmosDB() {
  const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
  });

  try {
    // Create database
    const { database } = await client.databases.createIfNotExists({
      id: 'BOH_Management'
    });
    console.log('✅ Database created/verified');

    // Create containers with partition keys and indexing policies
    const containers = [
      {
        id: 'users',
        partitionKey: { paths: ['/azureObjectId'] },
        indexingPolicy: {
          automatic: true,
          includedPaths: [{ path: '/*' }],
          excludedPaths: [{ path: '/"_etag"/?' }],
          compositeIndexes: [
            [{ path: '/email', order: 'ascending' }],
            [{ path: '/role', order: 'ascending' }]
          ]
        }
      },
      {
        id: 'vacationRequests',
        partitionKey: { paths: ['/employeeId'] },
        indexingPolicy: {
          automatic: true,
          includedPaths: [{ path: '/*' }],
          compositeIndexes: [
            [{ path: '/status', order: 'ascending' }],
            [{ path: '/startDate', order: 'ascending' }],
            [{ path: '/createdAt', order: 'descending' }]
          ]
        }
      },
      {
        id: 'tasks',
        partitionKey: { paths: ['/assigneeUid'] },
        indexingPolicy: {
          automatic: true,
          includedPaths: [{ path: '/*' }],
          compositeIndexes: [
            [{ path: '/status', order: 'ascending' }],
            [{ path: '/priority', order: 'ascending' }],
            [{ path: '/projectId', order: 'ascending' }]
          ]
        }
      },
      {
        id: 'projects',
        partitionKey: { paths: ['/managerId'] },
        indexingPolicy: {
          automatic: true,
          includedPaths: [{ path: '/*' }],
          compositeIndexes: [
            [{ path: '/status', order: 'ascending' }],
            [{ path: '/createdAt', order: 'descending' }]
          ]
        }
      },
      {
        id: 'workOrders',
        partitionKey: { paths: ['/assignedTeamLead'] },
        indexingPolicy: {
          automatic: true,
          includedPaths: [{ path: '/*' }],
          compositeIndexes: [
            [{ path: '/status', order: 'ascending' }],
            [{ path: '/priority', order: 'ascending' }],
            [{ path: '/location/region', order: 'ascending' }]
          ]
        }
      }
    ];

    for (const containerDef of containers) {
      await database.containers.createIfNotExists(containerDef);
      console.log(`✅ Container '${containerDef.id}' created/verified`);
    }

    console.log('🎉 Cosmos DB setup completed successfully!');
    return { success: true, database };

  } catch (error) {
    console.error('❌ Error setting up Cosmos DB:', error);
    throw error;
  }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCosmosDB()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

### Performance and Scaling Configuration
```javascript
// File: scripts/optimize-cosmos-performance.js
import { CosmosClient } from '@azure/cosmos';

export async function optimizeCosmosPerformance() {
  const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
    connectionPolicy: {
      requestTimeout: 30000,
      enableEndpointDiscovery: true,
      preferredLocations: ['East US', 'West US'], // Add your preferred regions
      retryOptions: {
        maxRetryAttemptCount: 3,
        fixedRetryIntervalInMilliseconds: 0,
        maxRetryIntervalInMilliseconds: 1000
      }
    }
  });

  const database = client.database('BOH_Management');

  // Set throughput for high-volume containers
  const throughputSettings = {
    users: 400,          // Lower throughput for user data
    vacationRequests: 800, // Medium throughput for vacation requests
    tasks: 1000,         // Higher throughput for task management
    projects: 600,       // Medium throughput for projects
    workOrders: 1200     // Highest throughput for work orders
  };

  for (const [containerName, throughput] of Object.entries(throughputSettings)) {
    try {
      const container = database.container(containerName);
      await container.offer.replace({
        offerThroughput: throughput,
        offerType: 'Provisioned'
      });
      console.log(`✅ Set throughput for ${containerName}: ${throughput} RU/s`);
    } catch (error) {
      console.error(`❌ Failed to set throughput for ${containerName}:`, error);
    }
  }
}
```

## Migration Validation Scripts

### Data Validation and Integrity
```javascript
// File: scripts/validate-migration.js
import { collection, getDocs } from 'firebase/firestore';
import CosmosService from '../lib/cosmos-service';

export async function validateMigration() {
  console.log('🔍 Starting migration validation...');

  const validationResults = {
    users: await validateContainer('users'),
    vacationRequests: await validateContainer('vacationRequests'),
    tasks: await validateContainer('tasks'),
    projects: await validateContainer('projects'),
    workOrders: await validateContainer('workOrders')
  };

  console.log('\n📊 Migration Validation Summary:');
  console.log('='.repeat(50));

  let totalFirebase = 0;
  let totalCosmos = 0;
  let totalIntegrityIssues = 0;

  for (const [collection, results] of Object.entries(validationResults)) {
    console.log(`\n${collection.toUpperCase()}:`);
    console.log(`  Firebase: ${results.firebaseCount}`);
    console.log(`  Cosmos DB: ${results.cosmosCount}`);
    console.log(`  Data Integrity: ${results.integrityIssues} issues`);
    console.log(`  Status: ${results.firebaseCount === results.cosmosCount && results.integrityIssues === 0 ? '✅ PASS' : '❌ FAIL'}`);

    totalFirebase += results.firebaseCount;
    totalCosmos += results.cosmosCount;
    totalIntegrityIssues += results.integrityIssues;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`TOTAL: Firebase ${totalFirebase} → Cosmos DB ${totalCosmos}`);
  console.log(`Data Integrity Issues: ${totalIntegrityIssues}`);
  console.log(`Overall Status: ${totalFirebase === totalCosmos && totalIntegrityIssues === 0 ? '✅ MIGRATION SUCCESSFUL' : '❌ MIGRATION ISSUES DETECTED'}`);

  return {
    success: totalFirebase === totalCosmos && totalIntegrityIssues === 0,
    summary: validationResults,
    totalFirebase,
    totalCosmos,
    totalIntegrityIssues
  };
}

async function validateContainer(containerName) {
  try {
    // Count Firebase documents
    const firebaseSnapshot = await getDocs(collection(db, containerName));
    const firebaseCount = firebaseSnapshot.size;

    // Count Cosmos DB documents
    const cosmosResult = await CosmosService.getContainerCount(containerName);
    const cosmosCount = cosmosResult.count;

    // Sample data integrity check
    const integrityIssues = await checkDataIntegrity(containerName, firebaseSnapshot);

    return {
      firebaseCount,
      cosmosCount,
      integrityIssues,
      match: firebaseCount === cosmosCount
    };
  } catch (error) {
    console.error(`Error validating ${containerName}:`, error);
    return {
      firebaseCount: 0,
      cosmosCount: 0,
      integrityIssues: 1,
      match: false,
      error: error.message
    };
  }
}

async function checkDataIntegrity(containerName, firebaseSnapshot) {
  let issues = 0;
  const sampleSize = Math.min(10, firebaseSnapshot.size); // Check first 10 documents

  for (let i = 0; i < sampleSize; i++) {
    try {
      const firebaseDoc = firebaseSnapshot.docs[i];
      const firebaseData = firebaseDoc.data();

      // Look up corresponding document in Cosmos DB
      const cosmosDoc = await CosmosService.getDocumentById(containerName, firebaseDoc.id);

      if (!cosmosDoc) {
        issues++;
        console.warn(`Missing document in Cosmos DB: ${firebaseDoc.id}`);
        continue;
      }

      // Check key fields match (customize based on container)
      if (containerName === 'users') {
        if (firebaseData.email !== cosmosDoc.email ||
            firebaseData.role !== cosmosDoc.role) {
          issues++;
          console.warn(`Data mismatch for user: ${firebaseDoc.id}`);
        }
      }
      // Add more integrity checks for other containers...

    } catch (error) {
      issues++;
      console.error(`Integrity check error for ${firebaseDoc.id}:`, error);
    }
  }

  return issues;
}
```

## Migration Execution Plan

### Pre-Migration Steps
1. **Backup Firestore Data**
   ```bash
   gcloud firestore export gs://your-backup-bucket/firestore-backup
   ```

2. **Set up Azure Cosmos DB**
   ```bash
   node scripts/setup-cosmos-db.js
   node scripts/optimize-cosmos-performance.js
   ```

3. **Test Migration Script with Sample Data**
   ```bash
   node scripts/test-migration.js --sample-size=10
   ```

4. **Verify Microsoft Graph API Access** (for Azure Object ID lookup)
   ```bash
   node scripts/test-graph-access.js
   ```

### Migration Execution

⚠️ **Important**: For 20,000+ records, this process may take **several days to weeks**. Plan accordingly.

1. **Users (Critical) - Estimated 2-4 hours**
   ```bash
   node scripts/migrate-users.js --batch-size=100 --delay=1000
   ```

2. **Vacation Requests - Estimated 4-8 hours**
   ```bash
   node scripts/migrate-vacation-requests.js --batch-size=50 --delay=2000
   ```

3. **Tasks and Projects - Estimated 1-3 days**
   ```bash
   node scripts/migrate-tasks.js --batch-size=100 --delay=1000
   node scripts/migrate-projects.js --batch-size=100 --delay=1000
   ```

4. **Work Orders - Estimated 1-2 days**
   ```bash
   node scripts/migrate-workorders.js --batch-size=50 --delay=2000
   ```

### Post-Migration Validation
1. **Comprehensive Data Validation**
   ```bash
   node scripts/validate-migration.js --deep-check
   ```

2. **Performance Testing**
   ```bash
   node scripts/performance-test.js --queries=all
   ```

3. **Functional Testing**
   - Test Microsoft Entra ID authentication
   - Test vacation request creation with Azure Object IDs
   - Test role-based permissions
   - Test Cosmos DB query performance
   - Validate Azure integration points

## Rollback Strategy

### If Migration Fails
1. **Keep Firestore Active**: Don't delete Firestore data until migration is verified (minimum 30 days)
2. **Environment Variables**: Switch `USE_COSMOS_DB=false` to fallback to Firebase
3. **Database Abstraction**: Use service layer to switch between backends seamlessly
4. **Gradual Migration**: Migrate one container at a time with validation checkpoints
5. **Cosmos DB Rollback**: Delete containers and recreate if needed (data loss risk)
6. **Dual Operation**: Run both systems in parallel during transition period

### Dual Operation Period

⚠️ **Critical**: Implement dual-operation support to minimize risk during migration.

```javascript
// File: lib/data-service.js
export class DataService {
  static async getUser(identifier) {
    if (process.env.USE_COSMOS_DB === 'true') {
      try {
        // Try Cosmos DB first
        const cosmosUser = await CosmosService.getUser({
          azureObjectId: identifier.azureObjectId || identifier,
          email: identifier.email
        });
        if (cosmosUser) return cosmosUser;
      } catch (error) {
        console.warn('Cosmos DB lookup failed, falling back to Firebase:', error);
      }
    }

    // Fallback to Firebase
    return await FirebaseService.getUser(identifier.firebaseUid || identifier);
  }

  static async createUser(userData) {
    const results = { cosmos: null, firebase: null };

    // Write to both systems during dual-operation period
    if (process.env.USE_COSMOS_DB === 'true') {
      try {
        results.cosmos = await CosmosService.createUser(userData);
      } catch (error) {
        console.error('Failed to create user in Cosmos DB:', error);
      }
    }

    if (process.env.KEEP_FIREBASE_SYNC === 'true') {
      try {
        results.firebase = await FirebaseService.createUser(userData);
      } catch (error) {
        console.error('Failed to create user in Firebase:', error);
      }
    }

    return results.cosmos || results.firebase;
  }
}
```

### Enhanced Rollback Strategy

#### Immediate Rollback (< 1 hour)
```bash
# Switch back to Firebase immediately
export USE_COSMOS_DB=false
export USE_SHAREPOINT=false
npm run build && npm run start
```

#### Data Rollback (< 4 hours)
```bash
# Restore from Firebase backup if needed
gcloud firestore import gs://your-backup-bucket/firestore-backup
```

#### Partial Rollback (Container-specific)
```javascript
// Rollback specific containers while keeping others
const containerRollbacks = {
  users: false,              // Keep users in Cosmos DB
  vacationRequests: true,    // Rollback to Firebase
  tasks: true,              // Rollback to Firebase
  projects: false           // Keep projects in Cosmos DB
};
```

## Performance Considerations

### Cosmos DB Optimization
- **Partition Strategy**: Use appropriate partition keys (azureObjectId, employeeId, etc.)
- **Request Units**: Monitor RU consumption and scale appropriately
- **Batch Operations**: Use bulk operations for large migrations (up to 100 items per batch)
- **Connection Pooling**: Reuse Cosmos DB client instances
- **Regional Distribution**: Configure multi-region if global access needed

### Migration Performance
- **Batch Size**: Start with 50-100 records per batch for large datasets
- **Rate Limiting**: Add delays (1-2 seconds) between batches to avoid throttling
- **Parallel Processing**: Use worker threads for independent collections
- **Progress Tracking**: Implement checkpoints to resume failed migrations
- **Memory Management**: Clear batches from memory after processing

### Query Performance
- **Indexing**: Cosmos DB automatically indexes all fields
- **Composite Indexes**: Create for multi-field queries (status + date)
- **Query Optimization**: Use SQL queries instead of filtered reads where possible
- **Caching Strategy**:
  - Redis for session data and frequently accessed user profiles
  - Application-level caching for reference data (roles, departments)
  - CDN caching for static assets

### Monitoring and Alerts
- Set up Azure Monitor alerts for:
  - High RU consumption
  - Query latency > 100ms
  - Failed requests > 5%
  - Storage usage > 80%

**Expected Performance After Migration:**
- User lookup: < 10ms (vs 50-100ms in Firebase)
- Vacation request queries: < 20ms
- Complex reporting queries: < 100ms
- Write operations: < 15ms

## Critical Success Factors

1. **Azure Object ID Mapping**: Crucial for linking Firebase users to Microsoft Entra ID
2. **Batch Processing**: Essential for handling 20,000+ records without API limits
3. **Dual Operation**: Mandatory safety net during transition period
4. **Performance Monitoring**: Real-time monitoring of RU consumption and query performance
5. **Data Validation**: Comprehensive validation at every step to ensure data integrity
6. **Rollback Readiness**: Quick rollback capability in case of critical issues

## Timeline Expectations

For **20,000 households** with associated data:
- **Planning Phase**: 2-3 days
- **Setup Phase**: 1-2 days
- **Migration Execution**: 1-2 weeks
- **Validation & Testing**: 3-5 days
- **Dual Operation Period**: 1-2 weeks
- **Final Cutover**: 1 day

**Total Estimated Timeline**: 4-6 weeks for complete migration