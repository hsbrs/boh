# Microsoft Teams Notifications Integration

## Overview
Replace Firebase push notifications with Microsoft Teams notifications for vacation approvals, task assignments, and system alerts.

## Implementation Approach

### 1. Teams Bot Application (Recommended)
Create a Teams bot for rich, interactive notifications with approval buttons.

### 2. Graph API Activity Feed (Alternative)
Use Microsoft Graph to send activity feed notifications.

### 3. Adaptive Cards (Enhanced UX)
Use Adaptive Cards for rich, actionable notifications.

## Teams Bot Setup

### Bot Registration
```json
{
  "name": "BOH Management Bot",
  "description": "Vacation and task management notifications",
  "iconUrl": "https://your-domain.com/bot-icon.png",
  "accentColor": "#FF6600",
  "bots": [
    {
      "botId": "your-bot-id",
      "scopes": ["personal", "team", "groupchat"],
      "commandLists": [
        {
          "scopes": ["personal"],
          "commands": [
            {
              "title": "Help",
              "description": "Show help information"
            },
            {
              "title": "My Requests",
              "description": "Show my vacation requests"
            }
          ]
        }
      ]
    }
  ],
  "permissions": ["identity", "messageTeamMembers"]
}
```

### Bot Framework Implementation

**File: `lib/teams-bot.js`**
```javascript
import { ActivityHandler, MessageFactory, CardFactory } from 'botbuilder';
import { GraphService } from './graph-service';

export class TeamsBot extends ActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      const text = context.activity.text.toLowerCase();

      switch (text) {
        case 'help':
          await this.sendHelpCard(context);
          break;
        case 'my requests':
          await this.sendVacationRequests(context);
          break;
        default:
          await context.sendActivity('Type "help" for available commands');
      }

      await next();
    });

    this.onInstallationUpdate(async (context, next) => {
      if (context.activity.action === 'add') {
        await this.sendWelcomeMessage(context);
      }
      await next();
    });
  }

  async sendVacationApprovalCard(context, request) {
    const card = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: '🏖️ Vacation Request Approval',
          weight: 'bolder',
          size: 'medium'
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Employee:', value: request.employeeName },
            { title: 'Dates:', value: `${request.startDate} - ${request.endDate}` },
            { title: 'Days:', value: request.dayCount.toString() },
            { title: 'Reason:', value: request.reason },
            { title: 'Replacement:', value: request.replacementName }
          ]
        }
      ],
      actions: [
        {
          type: 'Action.Http',
          title: '✅ Approve',
          url: `${process.env.NEXTAUTH_URL}/api/vacation/approve`,
          method: 'POST',
          body: JSON.stringify({
            requestId: request.id,
            action: 'approve'
          }),
          style: 'positive'
        },
        {
          type: 'Action.Http',
          title: '❌ Deny',
          url: `${process.env.NEXTAUTH_URL}/api/vacation/deny`,
          method: 'POST',
          body: JSON.stringify({
            requestId: request.id,
            action: 'deny'
          }),
          style: 'destructive'
        },
        {
          type: 'Action.OpenUrl',
          title: '👁️ View Details',
          url: `${process.env.NEXTAUTH_URL}/dashboard/vacation?id=${request.id}`
        }
      ]
    };

    const attachment = CardFactory.adaptiveCard(card);
    await context.sendActivity({ attachments: [attachment] });
  }

  async sendTaskAssignmentCard(context, task) {
    const card = {
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: '📋 New Task Assignment',
          weight: 'bolder',
          size: 'medium'
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Task:', value: task.title },
            { title: 'Priority:', value: task.priority },
            { title: 'Due Date:', value: task.dueDate },
            { title: 'Project:', value: task.project }
          ]
        }
      ],
      actions: [
        {
          type: 'Action.Http',
          title: '▶️ Start Task',
          url: `${process.env.NEXTAUTH_URL}/api/tasks/start`,
          method: 'POST',
          body: JSON.stringify({ taskId: task.id }),
          style: 'positive'
        },
        {
          type: 'Action.OpenUrl',
          title: '👁️ View Task',
          url: `${process.env.NEXTAUTH_URL}/dashboard/tasks?id=${task.id}`
        }
      ]
    };

    const attachment = CardFactory.adaptiveCard(card);
    await context.sendActivity({ attachments: [attachment] });
  }
}
```

## Notification Service Implementation

**File: `lib/teams-notifications.js`**
```javascript
import { GraphService } from './graph-service';
import { TeamsBot } from './teams-bot';

export class TeamsNotificationService {
  static async sendVacationApproval(request, approverEmail) {
    try {
      // Get approver's Teams chat
      const chat = await this.getOrCreateChat(approverEmail);

      // Create adaptive card
      const card = this.createVacationApprovalCard(request);

      // Send via Graph API
      await GraphService.sendTeamsMessage(chat.id, {
        body: {
          contentType: 'html',
          content: 'New vacation request requires your approval'
        },
        attachments: [card]
      });

    } catch (error) {
      console.error('Error sending Teams notification:', error);
      // Fallback to email
      await this.sendEmailNotification(request, approverEmail);
    }
  }

  static async sendTaskAssignment(task, assigneeEmail) {
    try {
      const chat = await this.getOrCreateChat(assigneeEmail);
      const card = this.createTaskAssignmentCard(task);

      await GraphService.sendTeamsMessage(chat.id, {
        body: {
          contentType: 'html',
          content: 'You have been assigned a new task'
        },
        attachments: [card]
      });

    } catch (error) {
      console.error('Error sending task notification:', error);
      await this.sendEmailNotification(task, assigneeEmail);
    }
  }

  static async getOrCreateChat(userEmail) {
    try {
      // Try to find existing chat
      const chats = await GraphService.getUserChats();
      const existingChat = chats.value.find(chat =>
        chat.members.some(member => member.email === userEmail)
      );

      if (existingChat) return existingChat;

      // Create new chat
      return await GraphService.createChat({
        chatType: 'oneOnOne',
        members: [
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            userId: await GraphService.getUserIdByEmail(userEmail)
          }
        ]
      });

    } catch (error) {
      console.error('Error managing Teams chat:', error);
      throw error;
    }
  }

  static createVacationApprovalCard(request) {
    return {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          {
            type: 'TextBlock',
            text: '🏖️ Vacation Request Approval',
            weight: 'bolder',
            size: 'medium',
            color: 'accent'
          },
          {
            type: 'Container',
            style: 'emphasis',
            items: [
              {
                type: 'FactSet',
                facts: [
                  { title: 'Employee:', value: request.employeeName },
                  { title: 'Dates:', value: `${request.startDate} - ${request.endDate}` },
                  { title: 'Days:', value: request.dayCount.toString() },
                  { title: 'Reason:', value: request.reason },
                  { title: 'Replacement:', value: request.replacementName }
                ]
              }
            ]
          }
        ],
        actions: [
          {
            type: 'Action.Http',
            title: '✅ Approve',
            url: `${process.env.NEXTAUTH_URL}/api/vacation/approve`,
            method: 'POST',
            headers: [
              { name: 'Content-Type', value: 'application/json' }
            ],
            body: JSON.stringify({
              requestId: request.id,
              action: 'approve'
            }),
            style: 'positive'
          },
          {
            type: 'Action.Http',
            title: '❌ Deny',
            url: `${process.env.NEXTAUTH_URL}/api/vacation/deny`,
            method: 'POST',
            headers: [
              { name: 'Content-Type', value: 'application/json' }
            ],
            body: JSON.stringify({
              requestId: request.id,
              action: 'deny'
            }),
            style: 'destructive'
          },
          {
            type: 'Action.OpenUrl',
            title: '👁️ View Details',
            url: `${process.env.NEXTAUTH_URL}/dashboard/vacation?id=${request.id}`
          }
        ]
      }
    };
  }
}
```

## API Routes for Teams Actions

**File: `app/api/vacation/approve/route.js`**
```javascript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { VacationService } from '@/lib/vacation-service';
import { TeamsNotificationService } from '@/lib/teams-notifications';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, action, comment } = await request.json();

    // Process approval
    const result = await VacationService.processApproval(
      requestId,
      action,
      session.user.email,
      comment
    );

    // Send notification to next approver if needed
    if (result.nextApprover) {
      await TeamsNotificationService.sendVacationApproval(
        result.request,
        result.nextApprover
      );
    }

    // Send confirmation back to Teams
    return NextResponse.json({
      type: 'message',
      text: `✅ Vacation request ${action}d successfully!`,
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: `✅ Request ${action}d`,
              weight: 'bolder',
              color: 'good'
            }
          ]
        }
      }]
    });

  } catch (error) {
    console.error('Error processing vacation approval:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Integration with Existing Vacation System

**Update: `app/dashboard/vacation/VacationRequestForm.tsx`**
```typescript
// Add Teams notification after vacation request creation
const handleSubmit = async (formData: VacationRequest) => {
  try {
    // Create vacation request in SharePoint
    const request = await VacationService.createRequest(formData);

    // Send Teams notification to HR
    const hrUsers = await UserService.getUsersByRole('hr');
    for (const hrUser of hrUsers) {
      await TeamsNotificationService.sendVacationApproval(
        request,
        hrUser.email
      );
    }

    // Show success message
    toast.success('Vacation request submitted and notifications sent!');

  } catch (error) {
    console.error('Error submitting vacation request:', error);
    toast.error('Failed to submit vacation request');
  }
};
```

## Deployment Configuration

**File: `teams-app/manifest.json`**
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "your-app-id",
  "packageName": "com.company.boh.management",
  "developer": {
    "name": "Your Company",
    "websiteUrl": "https://your-website.com",
    "privacyUrl": "https://your-website.com/privacy",
    "termsOfUseUrl": "https://your-website.com/terms"
  },
  "name": {
    "short": "BOH Management",
    "full": "BOH Management System"
  },
  "description": {
    "short": "Vacation and task management",
    "full": "Complete vacation request and task management system with approvals"
  },
  "icons": {
    "outline": "outline.png",
    "color": "color.png"
  },
  "accentColor": "#FF6600",
  "bots": [
    {
      "botId": "your-bot-id",
      "scopes": ["personal", "team", "groupchat"],
      "supportsFiles": false,
      "isNotificationOnly": false
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": [
    "your-domain.com"
  ]
}
```

## Testing Strategy

### Unit Tests
```javascript
// Test Teams notification service
describe('TeamsNotificationService', () => {
  test('should send vacation approval notification', async () => {
    const mockRequest = { /* vacation request data */ };
    const approverEmail = 'approver@company.com';

    await TeamsNotificationService.sendVacationApproval(
      mockRequest,
      approverEmail
    );

    expect(GraphService.sendTeamsMessage).toHaveBeenCalled();
  });
});
```

### Integration Tests
- Test bot responses
- Test adaptive card rendering
- Test approval workflow
- Test fallback to email

## Benefits Over Firebase Push Notifications

1. **Native Integration**: Works seamlessly with Microsoft 365
2. **Rich UI**: Adaptive cards with interactive buttons
3. **Action Buttons**: Direct approval/denial from notification
4. **Chat Integration**: Two-way communication
5. **Enterprise Security**: Azure AD authentication
6. **Mobile Support**: Native Teams mobile app
7. **Offline Support**: Teams handles offline message delivery