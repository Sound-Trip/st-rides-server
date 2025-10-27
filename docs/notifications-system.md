# Real-Time Notifications System

## Overview

The notification system provides real-time updates to drivers, passengers, and admins through a hybrid approach combining WebSocket connections for live app updates and Firebase Cloud Messaging (FCM) for background push notifications.

## Architecture

### Components

1. **WebSocket Gateway** (`websocket.gateway.ts`)
   - Manages real-time bidirectional connections
   - Handles user authentication via JWT tokens
   - Maintains user-specific and role-based rooms
   - Broadcasts ride updates to connected clients

2. **Notifications Service** (`notifications.service.ts`)
   - Core service for sending notifications
   - Integrates with Firebase Admin SDK for FCM
   - Manages notification creation and storage
   - Handles both real-time and push delivery

3. **Device Tokens Service** (`device-tokens.service.ts`)
   - Manages device token registration/unregistration
   - Maintains in-memory cache for quick access
   - Stores tokens in database for persistence
   - Handles invalid token cleanup

4. **Notification Delivery Service** (`notification-delivery.service.ts`)
   - Retry mechanism for failed notifications
   - Automatic cleanup of old notifications
   - User preference management
   - Bulk notification sending
   - Role-based notification targeting

5. **Event Broadcaster Service** (`event-broadcaster.service.ts`)
   - High-level API for broadcasting events
   - Ride status updates
   - Driver location tracking
   - Passenger join/leave events
   - System announcements

## Notification Flow

### Real-Time Updates (WebSocket)

\`\`\`
User App
   ↓
WebSocket Connection (JWT authenticated)
   ↓
NotificationsGateway
   ↓
User-specific room (user:{userId})
   ↓
Live feed update
\`\`\`

### Push Notifications (FCM)

\`\`\`
Backend Event
   ↓
NotificationsService.sendNotification()
   ↓
Save to database
   ↓
Send via WebSocket (if connected)
   ↓
Send via FCM (background delivery)
   ↓
Device receives notification
\`\`\`

## API Endpoints

### Notification Management

#### Get User Notifications
\`\`\`
GET /api/v1/notifications
Authorization: Bearer {token}

Response:
[
  {
    "id": "notif_123",
    "userId": "user_456",
    "type": "PUSH",
    "title": "Ride Accepted",
    "body": "Driver has accepted your ride",
    "isRead": false,
    "metadata": { "rideId": "ride_789" },
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
\`\`\`

#### Mark Notification as Read
\`\`\`
POST /api/v1/notifications/{id}/read
Authorization: Bearer {token}

Response:
{
  "id": "notif_123",
  "isRead": true,
  "updatedAt": "2024-01-15T10:35:00Z"
}
\`\`\`

#### Mark All Notifications as Read
\`\`\`
POST /api/v1/notifications/mark-all-read
Authorization: Bearer {token}

Response:
{
  "count": 5,
  "message": "All notifications marked as read"
}
\`\`\`

### Device Token Management

#### Register Device Token
\`\`\`
POST /api/v1/notifications/device-token/register
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "token": "fcm_device_token_xyz",
  "deviceType": "ios" | "android" | "web"
}

Response:
{
  "userId": "user_456",
  "token": "fcm_device_token_xyz",
  "deviceType": "ios"
}
\`\`\`

#### Unregister Device Token
\`\`\`
POST /api/v1/notifications/device-token/unregister
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "token": "fcm_device_token_xyz"
}

Response:
{
  "success": true
}
\`\`\`

#### Get User Device Tokens
\`\`\`
GET /api/v1/notifications/device-tokens
Authorization: Bearer {token}

Response:
[
  {
    "token": "fcm_device_token_xyz",
    "userId": "user_456"
  }
]
\`\`\`

### Notification Preferences

#### Get User Preferences
\`\`\`
GET /api/v1/notifications/preferences
Authorization: Bearer {token}

Response:
{
  "pushEnabled": true,
  "emailEnabled": false,
  "smsEnabled": false,
  "rideUpdates": true,
  "promotions": false,
  "systemAlerts": true
}
\`\`\`

#### Update User Preferences
\`\`\`
POST /api/v1/notifications/preferences
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "pushEnabled": true,
  "emailEnabled": false,
  "rideUpdates": true,
  "promotions": false
}

Response:
{
  "pushEnabled": true,
  "emailEnabled": false,
  "rideUpdates": true,
  "promotions": false
}
\`\`\`

### Statistics

#### Get Notification Stats
\`\`\`
GET /api/v1/notifications/stats
Authorization: Bearer {token}

Response:
{
  "totalNotifications": 1250,
  "unreadNotifications": 45,
  "notificationsLast24h": 120,
  "readRate": 96.4
}
\`\`\`

## WebSocket Events

### Connection

\`\`\`javascript
// Client-side
const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'jwt_token_here'
  }
});

socket.on('connect', () => {
  console.log('Connected to notifications');
});
\`\`\`

### Receiving Notifications

\`\`\`javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // {
  //   id: 'notif_123',
  //   title: 'Ride Accepted',
  //   body: 'Driver has accepted your ride',
  //   data: { rideId: 'ride_789' },
  //   timestamp: '2024-01-15T10:30:00Z'
  // }
});
\`\`\`

### Receiving Ride Updates

\`\`\`javascript
socket.on('ride:update', (data) => {
  console.log('Ride update:', data);
  // {
  //   rideId: 'ride_789',
  //   type: 'STATUS_CHANGE',
  //   status: 'ONGOING',
  //   timestamp: '2024-01-15T10:35:00Z'
  // }
});
\`\`\`

### Ride Update Types

- **STATUS_CHANGE**: Ride status changed (PENDING → SCHEDULED → ONGOING → COMPLETED)
- **DRIVER_LOCATION**: Driver location updated
- **PASSENGER_JOINED**: New passenger joined the ride
- **PASSENGER_LEFT**: Passenger left the ride
- **RIDE_ACCEPTED**: Driver accepted the ride
- **ETA_UPDATE**: Estimated time of arrival updated

## Notification Types

### Ride-Related Notifications

1. **RIDE_MATCHED** - Ride request matched to driver schedule
2. **RIDE_ACCEPTED** - Driver accepted passenger's ride request
3. **RIDE_STARTED** - Ride has started
4. **RIDE_COMPLETED** - Ride has been completed
5. **RIDE_CANCELLED** - Ride was cancelled
6. **PASSENGER_CANCELLED** - Passenger cancelled their booking
7. **PASSENGER_CONFIRMED** - Passenger confirmed their seat

### System Notifications

1. **GROUPED_REQUESTS** - Multiple ride requests grouped for driver
2. **SYSTEM_ANNOUNCEMENT** - System-wide announcements
3. **DRIVER_RATING_UPDATE** - Driver rating changed

## Firebase Cloud Messaging (FCM) Setup

### Prerequisites

1. Firebase project created
2. Service account key generated
3. Environment variable configured

### Configuration

\`\`\`bash
# .env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
\`\`\`

### Service Account Key Format

\`\`\`json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
\`\`\`

## Notification Delivery Guarantees

### Real-Time (WebSocket)
- **Delivery**: Immediate if user is connected
- **Fallback**: Stored in database, delivered on next connection
- **Retry**: Automatic retry every 5 minutes for unread notifications

### Push (FCM)
- **Delivery**: Within seconds, even if app is closed
- **Retry**: FCM handles automatic retries
- **Failure Handling**: Invalid tokens are automatically removed

## Scheduled Tasks

### Retry Failed Notifications
- **Frequency**: Every 5 minutes
- **Action**: Attempts to resend unread notifications from last hour
- **Purpose**: Ensures delivery of critical notifications

### Cleanup Old Notifications
- **Frequency**: Daily at midnight
- **Action**: Deletes read notifications older than 30 days
- **Purpose**: Maintains database performance

## Integration with Existing Flows

### Ride Request Acceptance
\`\`\`typescript
// When driver accepts a ride request
await this.notificationsService.sendNotification(
  passengerId,
  "Ride Accepted!",
  `Driver has accepted your ride. Departure at ${time}`,
  { rideId, type: "RIDE_ACCEPTED" }
);
\`\`\`

### Ride Cancellation
\`\`\`typescript
// When ride is cancelled
await this.notificationsService.sendNotification(
  passengerId,
  "Ride Cancelled",
  `Driver cancelled the ride. Reason: ${reason}`,
  { rideId, type: "RIDE_CANCELLED", reason }
);
\`\`\`

### Automatic Ride Matching
\`\`\`typescript
// When requests are grouped and drivers notified
await this.notificationsService.sendNotificationToRole(
  "DRIVER",
  `${count} Passengers Waiting`,
  `Passengers waiting from ${start} to ${end}`,
  { requestIds, type: "GROUPED_REQUESTS" }
);
\`\`\`

## Best Practices

1. **Always register device tokens** on app launch
2. **Handle connection failures** gracefully
3. **Respect user preferences** before sending notifications
4. **Use metadata** to provide context in notifications
5. **Test FCM** with test devices before production
6. **Monitor notification stats** for delivery issues
7. **Clean up old notifications** regularly
8. **Implement exponential backoff** for retries

## Troubleshooting

### Notifications Not Received

1. Check device token is registered
2. Verify Firebase credentials are correct
3. Check user notification preferences
4. Review notification logs
5. Ensure user is online or has valid device token

### WebSocket Connection Issues

1. Verify JWT token is valid
2. Check CORS configuration
3. Ensure WebSocket port is accessible
4. Review browser console for errors

### FCM Delivery Failures

1. Validate service account key
2. Check Firebase project configuration
3. Verify device tokens are valid
4. Review FCM error logs

## Future Enhancements

1. SMS notifications via Twilio
2. Email notifications
3. In-app notification center UI
4. Notification scheduling
5. A/B testing for notification content
6. Advanced analytics and reporting
7. Notification templates
8. Multi-language support
