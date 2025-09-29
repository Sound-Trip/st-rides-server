# Notification System Endpoints

## Overview
The notification system handles push notifications, SMS, and email communications for ride updates, system alerts, and promotional messages.

## Endpoints

### 🔒 GET /notifications/:userId
Get notifications for a specific user.

**Parameters:**
- `userId` (path): User ID

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50)

**Response:**
\`\`\`json
{
  "success": true,
  "notifications": [
    {
      "id": "string",
      "userId": "string",
      "type": "PUSH" | "SMS" | "EMAIL",
      "title": "string",
      "body": "string",
      "isRead": boolean,
      "via": "push" | "sms" | "email",
      "metadata": {
        "rideId": "string",
        "driverId": "string",
        "actionUrl": "string",
        "priority": "high" | "medium" | "low"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "unreadCount": number
}
\`\`\`

**Purpose:** Retrieves user's notification history with read/unread status.

---

### 🔒 PATCH /notifications/:userId/:notificationId/read
Mark a notification as read.

**Parameters:**
- `userId` (path): User ID
- `notificationId` (path): Notification ID

**Response:**
\`\`\`json
{
  "success": true,
  "notification": {
    "id": "string",
    "isRead": true,
    "readAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Updates notification read status for user interface management.

---

### 🔒 POST /notifications/send
Send a generic notification (Admin/Testing).

**Request Body:**
\`\`\`json
{
  "userId": "string",
  "type": "PUSH" | "SMS" | "EMAIL",
  "title": "string",
  "message": "string",
  "via": "push" | "sms" | "email", // Optional, defaults to "push"
  "metadata": {
    "actionUrl": "string",
    "priority": "high" | "medium" | "low",
    "category": "ride" | "payment" | "system" | "promotion"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "notification": {
    "id": "string",
    "userId": "string",
    "type": "PUSH" | "SMS" | "EMAIL",
    "title": "string",
    "body": "string",
    "via": "push" | "sms" | "email",
    "status": "sent" | "pending" | "failed",
    "sentAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Sends custom notifications for testing or admin-triggered messages.

## Notification Types

### PUSH Notifications
- **Ride Updates**: Driver assigned, ride started, completed
- **Real-time Alerts**: Driver nearby, pickup ready
- **System Notifications**: Maintenance, updates, promotions

### SMS Notifications
- **Critical Updates**: Ride cancellations, emergency alerts
- **OTP Codes**: Authentication and verification
- **Payment Confirmations**: Successful transactions

### EMAIL Notifications
- **Receipts**: Ride summaries and invoices
- **Account Updates**: Profile changes, security alerts
- **Marketing**: Promotional offers and newsletters

## Automatic Notifications

The system automatically sends notifications for:

### Ride Lifecycle
- **Request Created**: "Looking for drivers nearby..."
- **Driver Assigned**: "John is coming to pick you up"
- **Driver Arrived**: "Your driver has arrived"
- **Ride Started**: "Your ride has started"
- **Ride Completed**: "You've arrived at your destination"
- **Ride Cancelled**: "Your ride has been cancelled"

### Payment Events
- **Payment Successful**: "Payment of ₦500 processed"
- **Wallet Credited**: "Your wallet has been credited"
- **Cashout Approved**: "Your cashout request is approved"

### System Events
- **Maintenance Due**: "Vehicle maintenance is due"
- **Account Suspended**: "Your account has been suspended"
- **New Features**: "Check out our new features"

## Notification Metadata

Notifications can include additional data:

\`\`\`json
{
  "metadata": {
    "rideId": "string", // Associated ride
    "driverId": "string", // Associated driver
    "passengerId": "string", // Associated passenger
    "amount": number, // Payment amount
    "actionUrl": "string", // Deep link URL
    "priority": "high" | "medium" | "low",
    "category": "ride" | "payment" | "system" | "promotion",
    "expiresAt": "2024-01-01T00:00:00.000Z",
    "imageUrl": "string", // Notification image
    "buttons": [
      {
        "text": "Accept",
        "action": "accept_ride",
        "url": "string"
      }
    ]
  }
}
\`\`\`

## Delivery Channels

### Push Notifications
- **Mobile Apps**: iOS and Android push notifications
- **Web Browser**: Browser push notifications
- **Real-time**: Instant delivery

### SMS
- **Local Numbers**: Nigerian mobile networks
- **International**: Global SMS delivery
- **Delivery Reports**: Success/failure tracking

### Email
- **Transactional**: Automated system emails
- **Marketing**: Promotional campaigns
- **Templates**: Branded email designs

## Error Responses

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "Notification not found"
}
\`\`\`

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Invalid notification type"
}
\`\`\`

**429 Too Many Requests:**
\`\`\`json
{
  "success": false,
  "message": "Notification rate limit exceeded"
}
\`\`\`

## Privacy and Preferences

Users can control notification preferences:
- **Push notifications**: Enable/disable by category
- **SMS notifications**: Opt-in/opt-out for non-critical messages
- **Email notifications**: Subscription management
- **Quiet hours**: Schedule notification-free periods

## Integration Examples

### Mobile App Integration
\`\`\`javascript
// Register for push notifications
const token = await messaging().getToken();
await api.post('/users/me/push-token', { token });

// Handle incoming notifications
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
});
\`\`\`

### Webhook Integration
\`\`\`javascript
// Webhook endpoint for notification status
app.post('/webhooks/notifications', (req, res) => {
  const { notificationId, status, deliveredAt } = req.body;
  // Update notification delivery status
});
