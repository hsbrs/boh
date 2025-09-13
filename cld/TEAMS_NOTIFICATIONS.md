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

⚠️ **Important Security Consideration**: Adaptive Cards with Action.Http buttons require secure webhook authentication and proper token validation to ensure requests originate from legitimate Teams clients. This adds significant complexity compared to simple notifications.

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

### Security Testing
- **Signature Validation**: Test webhook signature verification
- **Token Validation**: Verify JWT token authentication
- **Permission Testing**: Test role-based action permissions
- **Replay Attack Prevention**: Verify timestamp validation
- **Rate Limiting**: Test API endpoint throttling

### Integration Tests
- Test bot responses
- Test adaptive card rendering
- Test secure approval workflow
- Test fallback to email when Teams unavailable
- Test webhook authentication
- Test error handling for invalid tokens

## Security Implementation for Webhook Actions

⚠️ **Critical Security Warning**: The developer correctly identified that Action.Http buttons in Teams require complex webhook authentication. Here's the secure implementation:

### Webhook Authentication Service

**File: `lib/teams-auth.js`**
```javascript
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class TeamsAuthService {
  static validateTeamsSignature(request, body) {
    const signature = request.headers['x-teams-signature'];
    const timestamp = request.headers['x-teams-timestamp'];

    if (!signature || !timestamp) {
      throw new Error('Missing Teams signature or timestamp');
    }

    // Check timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);

    if (Math.abs(now - requestTime) > 300) {
      throw new Error('Request timestamp too old');
    }

    // Validate signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.TEAMS_BOT_SECRET)
      .update(timestamp + body)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid Teams signature');
    }

    return true;
  }

  static async validateTeamsToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Verify JWT token from Microsoft
      const decoded = jwt.verify(token, process.env.MICROSOFT_JWT_SECRET, {
        algorithms: ['RS256'],
        audience: process.env.AZURE_AD_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
      });

      return decoded;
    } catch (error) {
      throw new Error('Invalid Teams token: ' + error.message);
    }
  }
}
```

### Secure API Endpoints

**File: `app/api/teams/vacation/approve/route.js`**
```javascript
import { NextResponse } from 'next/server';
import { VacationService } from '@/lib/vacation-service';
import { TeamsAuthService } from '@/lib/teams-auth';

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // 1. Validate Teams signature for security
    TeamsAuthService.validateTeamsSignature(request, rawBody);

    // 2. Validate and decode Teams token
    const authHeader = request.headers.get('authorization');
    const tokenPayload = await TeamsAuthService.validateTeamsToken(authHeader);

    // 3. Get user information from Teams context
    const user = await CosmosService.getUser({ azureObjectId: tokenPayload.sub });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Verify user has permission to approve
    const { requestId, action, comment } = body;
    const vacationRequest = await VacationService.getRequest(requestId);

    if (!VacationService.canUserApprove(user, vacationRequest)) {
      return NextResponse.json({
        error: 'Insufficient permissions to approve this request'
      }, { status: 403 });
    }

    // 5. Process approval
    const result = await VacationService.processApproval(
      requestId,
      action,
      user.azureObjectId,
      comment
    );

    // 6. Return success response
    return NextResponse.json({
      type: 'message',
      text: `✅ Vacation request ${action}d successfully by ${user.fullName}!`
    });

  } catch (error) {
    console.error('Teams webhook error:', error);

    if (error.message.includes('signature') || error.message.includes('token')) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Security Best Practices

### Webhook Security Requirements
1. **Always validate signatures** from Teams using HMAC-SHA256
2. **Check timestamps** to prevent replay attacks (5-minute window)
3. **Validate JWT tokens** from Microsoft identity platform
4. **Use HTTPS only** for all webhook endpoints
5. **Rate limiting** on webhook endpoints (100 requests/hour per user)
6. **Audit logging** for all approval actions
7. **Input validation** on all webhook payloads

### Environment Variables Required
```env
# Teams Security
TEAMS_BOT_SECRET="your-teams-bot-secret-from-app-registration"
MICROSOFT_JWT_SECRET="microsoft-public-key-for-jwt-verification"
TEAMS_WEBHOOK_URL="https://your-domain.com/api/teams/webhook"

# Rate Limiting
TEAMS_RATE_LIMIT_REQUESTS=100
TEAMS_RATE_LIMIT_WINDOW=3600  # 1 hour
```

### Alternative Approach: Simpler Notifications
If webhook security complexity is too high, consider simpler approaches:
1. **Deep Links**: Open app in Teams instead of HTTP actions
2. **Notification Only**: Send notifications without action buttons
3. **Redirect to Web**: Action buttons open web interface

## Benefits Over Firebase Push Notifications

1. **Native Integration**: Works seamlessly with Microsoft 365
2. **Rich UI**: Adaptive cards with interactive buttons
3. **Action Buttons**: Direct approval/denial from notification (with proper security)
4. **Chat Integration**: Two-way communication
5. **Enterprise Security**: Azure AD authentication + webhook validation
6. **Mobile Support**: Native Teams mobile app
7. **Offline Support**: Teams handles offline message delivery
8. **Enhanced Security**: Signature validation and JWT authentication
9. **Audit Trail**: Complete logging of all approval actions via Teams

## Implementation Complexity Warning

⚠️ **Developer Assessment Confirmed**: The full stack developer correctly identified that implementing secure Teams webhooks with Action.Http buttons is significantly more complex than simple notifications. Consider the trade-offs:

**Simple Notifications (Low Complexity):**
- Send notifications without action buttons
- Users click to open web interface
- Standard Microsoft Graph API calls
- No webhook authentication required

**Interactive Cards (High Complexity):**
- Action buttons in notifications
- Webhook signature validation required
- JWT token validation required
- Rate limiting and security hardening
- Comprehensive error handling
- Audit logging implementation

**Recommendation**: Start with simple notifications and upgrade to interactive cards in Phase 2 if the security implementation can be properly managed.