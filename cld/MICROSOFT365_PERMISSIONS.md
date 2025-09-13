# Microsoft 365 Services and Required Permissions

## Required Microsoft Graph API Permissions

### Authentication & User Management
- **User.Read**: Read user profile
- **User.ReadWrite.All**: Manage user profiles (Admin only)
- **Directory.Read.All**: Read directory data
- **Directory.AccessAsUser.All**: Access directory as signed-in user

### SharePoint (Data Storage)
- **Sites.ReadWrite.All**: Read and write to all SharePoint sites
- **Sites.Manage.All**: Manage SharePoint sites (Admin only)
- **Files.ReadWrite.All**: Read and write files in SharePoint

### Microsoft Teams (Notifications)
- **Chat.ReadWrite**: Send messages and notifications
- **TeamsActivity.Send**: Send activity feed notifications
- **Channel.ReadBasic.All**: Read basic channel info
- **ChatMessage.Send**: Send chat messages

### Outlook Calendar (Vacation Integration)
- **Calendar.ReadWrite**: Read and write calendar events
- **Calendar.ReadWrite.Shared**: Access shared calendars
- **Mail.Send**: Send email notifications

### Additional Permissions
- **People.Read**: Read user contacts for replacement selection
- **Presence.Read.All**: Read user presence (for availability)
- **Tasks.ReadWrite**: Manage tasks and to-do items

## SharePoint Lists Structure

### Users List
- **Title**: Full Name
- **Email**: User email (lookup)
- **Role**: Choice (employee, hr, pm, manager, admin)
- **IsApproved**: Yes/No
- **Department**: Single line text
- **HireDate**: Date
- **Manager**: Person lookup

### Vacation Requests List
- **Title**: Employee Name + Date Range
- **Employee**: Person lookup
- **StartDate**: Date
- **EndDate**: Date
- **Reason**: Multiple lines text
- **ReplacementPerson**: Person lookup
- **Status**: Choice (pending, hr_review, pm_review, approved, denied)
- **HRApproval**: Yes/No
- **PMApproval**: Yes/No
- **ManagerApproval**: Yes/No
- **Comments**: Multiple lines text
- **CreatedDate**: Date
- **ModifiedDate**: Date

### Tasks List
- **Title**: Task name
- **AssignedTo**: Person lookup
- **Status**: Choice (Planned, In Progress, Done)
- **Priority**: Choice (Low, Medium, High)
- **StartDate**: Date
- **EndDate**: Date
- **ActualStartTime**: Date and Time
- **ActualEndTime**: Date and Time
- **Notes**: Multiple lines text
- **Project**: Lookup to Projects list

### Projects List
- **Title**: Project name
- **Description**: Multiple lines text
- **Status**: Choice (Active, Completed, On Hold)
- **Manager**: Person lookup
- **StartDate**: Date
- **EndDate**: Date
- **Budget**: Currency
- **Progress**: Number (0-100)

### Work Orders List
- **Title**: Work order number
- **Description**: Multiple lines text
- **AssignedTeam**: Person lookup (multiple)
- **Status**: Choice (Pending, In Progress, Completed)
- **Priority**: Choice (Low, Medium, High, Critical)
- **CreatedDate**: Date
- **DueDate**: Date
- **CompletedDate**: Date
- **Location**: Single line text
- **Attachments**: File attachment

## Power Automate Flows (Optional)

### Vacation Approval Workflow
1. **Trigger**: New vacation request created
2. **Action**: Send Teams notification to HR
3. **Condition**: If HR approves → Send to PM
4. **Condition**: If PM approves → Send to Manager
5. **Action**: Add calendar event when approved
6. **Action**: Send final notification

### Task Assignment Notifications
1. **Trigger**: Task assigned or status changed
2. **Action**: Send Teams notification to assignee
3. **Action**: Update project progress if needed

## Security Considerations
- Use **Application permissions** for backend operations
- Use **Delegated permissions** for user-initiated actions
- Implement proper role-based access in code
- Regular permission audits
- Use least-privilege principle