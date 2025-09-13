# Outlook Calendar Integration for Vacation Requests

## Overview
Integrate vacation requests with Outlook Calendar to automatically create calendar events, show team availability, and manage vacation schedules.

## Implementation Features

### 1. Automatic Calendar Events
- Create calendar events when vacation is approved
- Send meeting invitations to replacement person
- Block time on employee's calendar
- Add vacation details in event description

### 2. Team Calendar View
- Show team vacation schedule
- Display availability for vacation planning
- Conflict detection for overlapping requests

### 3. Calendar-Based Approvals
- Calendar integration for approvers
- Meeting requests for approval workflow
- Automatic reminders for pending approvals

## Calendar Service Implementation

**File: `lib/outlook-calendar.js`**
```javascript
import { GraphService } from './graph-service';

export class OutlookCalendarService {
  static async createVacationEvent(vacationRequest) {
    try {
      const event = {
        subject: `🏖️ ${vacationRequest.employeeName} - Vacation`,
        body: {
          contentType: 'HTML',
          content: `
            <div style="font-family: Arial, sans-serif;">
              <h3>Vacation Details</h3>
              <p><strong>Employee:</strong> ${vacationRequest.employeeName}</p>
              <p><strong>Duration:</strong> ${vacationRequest.startDate} to ${vacationRequest.endDate}</p>
              <p><strong>Days:</strong> ${vacationRequest.dayCount}</p>
              <p><strong>Reason:</strong> ${vacationRequest.reason}</p>
              <p><strong>Replacement:</strong> ${vacationRequest.replacementName}</p>
              <p><strong>Status:</strong> ${vacationRequest.status}</p>
              <hr>
              <p><em>This event was created automatically by BOH Management System</em></p>
            </div>
          `
        },
        start: {
          dateTime: `${vacationRequest.startDate}T09:00:00.0000000`,
          timeZone: 'UTC'
        },
        end: {
          dateTime: `${vacationRequest.endDate}T17:00:00.0000000`,
          timeZone: 'UTC'
        },
        isAllDay: true,
        showAs: 'oof', // Out of Office
        sensitivity: 'normal',
        categories: ['Vacation', 'HR'],
        attendees: [
          {
            emailAddress: {
              address: vacationRequest.employeeEmail,
              name: vacationRequest.employeeName
            },
            type: 'required'
          },
          {
            emailAddress: {
              address: vacationRequest.replacementEmail,
              name: vacationRequest.replacementName
            },
            type: 'optional'
          }
        ],
        location: {
          displayName: 'Out of Office - Vacation'
        }
      };

      const calendarEvent = await GraphService.createCalendarEvent(event);

      // Update vacation request with calendar event ID
      await this.linkVacationToCalendar(vacationRequest.id, calendarEvent.id);

      return calendarEvent;

    } catch (error) {
      console.error('Error creating vacation calendar event:', error);
      throw error;
    }
  }

  static async updateVacationEvent(vacationRequest, calendarEventId) {
    try {
      const updates = {
        subject: `🏖️ ${vacationRequest.employeeName} - Vacation (${vacationRequest.status})`,
        body: {
          contentType: 'HTML',
          content: this.generateEventBody(vacationRequest)
        }
      };

      // Add approval status to event
      if (vacationRequest.status === 'approved') {
        updates.categories = ['Vacation', 'HR', 'Approved'];
        updates.showAs = 'oof';
      } else if (vacationRequest.status === 'denied') {
        updates.categories = ['Vacation', 'HR', 'Denied'];
        updates.showAs = 'free';
      }

      return await GraphService.updateCalendarEvent(calendarEventId, updates);

    } catch (error) {
      console.error('Error updating vacation calendar event:', error);
      throw error;
    }
  }

  static async deleteVacationEvent(calendarEventId) {
    try {
      await GraphService.deleteCalendarEvent(calendarEventId);
    } catch (error) {
      console.error('Error deleting vacation calendar event:', error);
      throw error;
    }
  }

  static async getTeamAvailability(startDate, endDate, teamEmails) {
    try {
      const freeTime = await GraphService.getFreeBusy({
        schedules: teamEmails,
        startTime: {
          dateTime: startDate,
          timeZone: 'UTC'
        },
        endTime: {
          dateTime: endDate,
          timeZone: 'UTC'
        },
        availabilityViewInterval: 60
      });

      return freeTime.value.map((schedule, index) => ({
        email: teamEmails[index],
        availability: schedule.freeBusyViewType,
        busyTimes: schedule.busyTimes
      }));

    } catch (error) {
      console.error('Error getting team availability:', error);
      throw error;
    }
  }

  static async checkVacationConflicts(vacationRequest, teamEmails) {
    try {
      const availability = await this.getTeamAvailability(
        vacationRequest.startDate,
        vacationRequest.endDate,
        teamEmails
      );

      const conflicts = availability.filter(member =>
        member.busyTimes.some(busyTime =>
          busyTime.start <= vacationRequest.endDate &&
          busyTime.end >= vacationRequest.startDate
        )
      );

      return conflicts;

    } catch (error) {
      console.error('Error checking vacation conflicts:', error);
      return [];
    }
  }

  static async createApprovalMeeting(vacationRequest, approverEmail) {
    try {
      const meeting = {
        subject: `🔔 Vacation Approval Required: ${vacationRequest.employeeName}`,
        body: {
          contentType: 'HTML',
          content: `
            <div style="font-family: Arial, sans-serif;">
              <h3>Vacation Approval Required</h3>
              <p>Please review and approve the following vacation request:</p>

              <table style="border-collapse: collapse; width: 100%;">
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Employee:</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.employeeName}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Dates:</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.startDate} to ${vacationRequest.endDate}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Days:</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.dayCount}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Reason:</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.reason}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;"><strong>Replacement:</strong></td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.replacementName}</td>
                </tr>
              </table>

              <br>
              <p>
                <a href="${process.env.NEXTAUTH_URL}/dashboard/vacation?id=${vacationRequest.id}"
                   style="background-color: #0078d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                   Review Request
                </a>
              </p>
            </div>
          `
        },
        start: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 30 min later
          timeZone: 'UTC'
        },
        attendees: [
          {
            emailAddress: {
              address: approverEmail
            },
            type: 'required'
          }
        ],
        reminderMinutesBeforeStart: 15,
        categories: ['Vacation Approval', 'HR']
      };

      return await GraphService.createCalendarEvent(meeting);

    } catch (error) {
      console.error('Error creating approval meeting:', error);
      throw error;
    }
  }

  static async linkVacationToCalendar(vacationId, calendarEventId) {
    try {
      // Update vacation request in SharePoint with calendar event ID
      await GraphService.updateListItem('VacationRequests', vacationId, {
        CalendarEventId: calendarEventId
      });

    } catch (error) {
      console.error('Error linking vacation to calendar:', error);
    }
  }

  static generateEventBody(vacationRequest) {
    const statusEmoji = {
      'pending': '⏳',
      'hr_review': '👥',
      'pm_review': '📋',
      'approved': '✅',
      'denied': '❌'
    };

    return `
      <div style="font-family: Arial, sans-serif;">
        <h3>${statusEmoji[vacationRequest.status]} Vacation Request</h3>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Employee:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.employeeName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Duration:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.startDate} to ${vacationRequest.endDate}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Days:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.dayCount}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Reason:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.reason}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Replacement:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.replacementName}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;"><strong>Status:</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${vacationRequest.status}</td>
          </tr>
        </table>
        <hr>
        <p><em>Managed by BOH Management System</em></p>
      </div>
    `;
  }
}
```

## Calendar Dashboard Component

**File: `components/CalendarDashboard.tsx`**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { OutlookCalendarService } from '@/lib/outlook-calendar';
import { Card } from '@/components/ui/card';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  color: string;
}

export function CalendarDashboard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVacationEvents();
  }, []);

  const loadVacationEvents = async () => {
    try {
      const vacationRequests = await OutlookCalendarService.getTeamVacations();

      const calendarEvents = vacationRequests.map(vacation => ({
        id: vacation.id,
        title: `🏖️ ${vacation.employeeName}`,
        start: new Date(vacation.startDate),
        end: new Date(vacation.endDate),
        resource: vacation,
        color: getStatusColor(vacation.status)
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading vacation events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: '#fbbf24',    // yellow
      hr_review: '#3b82f6',  // blue
      pm_review: '#8b5cf6',  // purple
      approved: '#10b981',   // green
      denied: '#ef4444'      // red
    };
    return colors[status] || '#6b7280';
  };

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block'
    }
  });

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Team Vacation Calendar</h3>

      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          defaultView="month"
          popup
          onSelectEvent={(event) => {
            // Open vacation details
            window.open(`/dashboard/vacation?id=${event.id}`, '_blank');
          }}
          components={{
            event: ({ event }) => (
              <div>
                <strong>{event.title}</strong>
                <br />
                <small>{event.resource.status}</small>
              </div>
            )
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span className="text-sm">Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm">HR Review</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm">PM Review</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Approved</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Denied</span>
        </div>
      </div>
    </Card>
  );
}
```

## Integration with Vacation Workflow

**Update: `lib/vacation-service.js`**
```javascript
import { OutlookCalendarService } from './outlook-calendar';
import { TeamsNotificationService } from './teams-notifications';

export class VacationService {
  static async createRequest(vacationData) {
    try {
      // Create vacation request in SharePoint
      const request = await GraphService.createListItem('VacationRequests', {
        ...vacationData,
        Status: 'pending',
        CreatedDate: new Date().toISOString()
      });

      // Check for calendar conflicts
      const teamEmails = await this.getTeamEmails();
      const conflicts = await OutlookCalendarService.checkVacationConflicts(
        request,
        teamEmails
      );

      if (conflicts.length > 0) {
        // Add conflict warning to request
        await GraphService.updateListItem('VacationRequests', request.id, {
          ConflictWarning: `Potential conflicts detected with: ${conflicts.map(c => c.email).join(', ')}`
        });
      }

      // Create placeholder calendar event (pending approval)
      await OutlookCalendarService.createVacationEvent(request);

      // Send Teams notification to HR
      const hrUsers = await UserService.getUsersByRole('hr');
      for (const hrUser of hrUsers) {
        await TeamsNotificationService.sendVacationApproval(request, hrUser.email);
        await OutlookCalendarService.createApprovalMeeting(request, hrUser.email);
      }

      return request;

    } catch (error) {
      console.error('Error creating vacation request:', error);
      throw error;
    }
  }

  static async approveRequest(requestId, approverEmail, comment = '') {
    try {
      const request = await GraphService.getListItem('VacationRequests', requestId);

      // Update approval status
      const updatedRequest = await this.updateApprovalStatus(
        request,
        approverEmail,
        'approved',
        comment
      );

      // Update calendar event
      if (request.CalendarEventId) {
        await OutlookCalendarService.updateVacationEvent(
          updatedRequest,
          request.CalendarEventId
        );
      }

      // If final approval, mark calendar as confirmed
      if (updatedRequest.Status === 'approved') {
        await OutlookCalendarService.updateVacationEvent(updatedRequest, request.CalendarEventId);

        // Send confirmation to employee
        await TeamsNotificationService.sendVacationConfirmation(
          updatedRequest,
          updatedRequest.EmployeeEmail
        );
      }

      return updatedRequest;

    } catch (error) {
      console.error('Error approving vacation request:', error);
      throw error;
    }
  }

  static async denyRequest(requestId, approverEmail, comment = '') {
    try {
      const request = await GraphService.getListItem('VacationRequests', requestId);

      // Update to denied status
      const updatedRequest = await GraphService.updateListItem('VacationRequests', requestId, {
        Status: 'denied',
        DenialComment: comment,
        DeniedBy: approverEmail,
        DeniedDate: new Date().toISOString()
      });

      // Delete calendar event
      if (request.CalendarEventId) {
        await OutlookCalendarService.deleteVacationEvent(request.CalendarEventId);
      }

      // Send denial notification
      await TeamsNotificationService.sendVacationDenial(
        updatedRequest,
        updatedRequest.EmployeeEmail,
        comment
      );

      return updatedRequest;

    } catch (error) {
      console.error('Error denying vacation request:', error);
      throw error;
    }
  }
}
```

## Required Graph API Permissions

Add to existing permissions:
- **Calendar.ReadWrite**: Create and manage calendar events
- **Calendar.ReadWrite.Shared**: Access shared calendars
- **Calendar.Read**: Read calendar information
- **MailboxSettings.ReadWrite**: Set out-of-office messages

## Benefits of Outlook Integration

1. **Unified Calendar**: All vacation requests visible in team calendar
2. **Conflict Detection**: Automatic detection of overlapping requests
3. **Availability Checking**: Real-time team availability
4. **Out-of-Office**: Automatic out-of-office message setup
5. **Meeting Integration**: Calendar-based approval workflow
6. **Mobile Access**: Native Outlook mobile app support
7. **Recurring Events**: Support for recurring vacation patterns