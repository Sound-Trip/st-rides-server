# Admin Endpoints

## Overview
Admin endpoints provide comprehensive platform management capabilities including user management, ride monitoring, maintenance oversight, system configuration, and financial transaction management.

## Authentication
All admin endpoints require admin authentication and the `ADMIN` role.

## Endpoints

### 🔒 GET /admin/dashboard
Get admin dashboard statistics.

**Response:**
\`\`\`json
{
  "success": true,
  "dashboard": {
    "overview": {
      "totalUsers": number,
      "activeDrivers": number,
      "activePassengers": number,
      "totalRides": number,
      "ridesThisMonth": number,
      "revenue": number,
      "revenueThisMonth": number
    },
    "rideStats": {
      "pendingRides": number,
      "ongoingRides": number,
      "completedToday": number,
      "cancelledToday": number,
      "averageRideTime": number,
      "averageWaitTime": number
    },
    "userStats": {
      "newUsersToday": number,
      "newUsersThisWeek": number,
      "activeDriversOnline": number,
      "driverUtilizationRate": number
    },
    "financialStats": {
      "totalCommissionEarned": number,
      "pendingPayouts": number,
      "walletBalance": number,
      "averageRideValue": number
    }
  }
}
\`\`\`

**Purpose:** Provides comprehensive platform metrics for administrative oversight.

---

### 🔒 GET /admin/users
Get all users with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by user role

**Response:**
\`\`\`json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "email": "string",
      "role": "PASSENGER" | "DRIVER" | "ADMIN" | "SUPPORT_AGENT",
      "isActive": boolean,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "totalRides": number,
      "walletBalance": number,
      "rating": number,
      "driverProfile": {
        "vehicleType": "KEKE" | "CAR" | "BUS",
        "vehicleModel": "string",
        "plateNumber": "string",
        "isOnline": boolean,
        "totalEarnings": number
      },
      "passengerProfile": {
        "earnedTokens": number,
        "totalSpent": number
      }
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
\`\`\`

**Purpose:** Lists all platform users with detailed information for management.

---

### 🔒 POST /admin/drivers
Create a new driver account.

**Request Body:**
\`\`\`json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "email": "string", // Optional
  "vehicleType": "KEKE" | "CAR" | "BUS",
  "vehicleModel": "string",
  "plateNumber": "string",
  "licenseNumber": "string",
  "assignedRouteId": "string", // Optional
  "isCompanyVehicle": boolean // Optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "driver": {
    "id": "string",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "email": "string",
      "role": "DRIVER"
    },
    "driverProfile": {
      "vehicleType": "KEKE" | "CAR" | "BUS",
      "vehicleModel": "string",
      "plateNumber": "string",
      "licenseNumber": "string",
      "isCompanyVehicle": boolean,
      "walletBalance": 0,
      "totalEarnings": 0,
      "rating": null,
      "totalRides": 0
    }
  }
}
\`\`\`

**Purpose:** Allows admins to create driver accounts with vehicle information.

---

### 🔒 PUT /admin/users/:id/ban
Ban a user account.

**Parameters:**
- `id` (path): User ID

**Request Body:**
\`\`\`json
{
  "reason": "string" // Optional ban reason
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "isActive": false,
    "bannedAt": "2024-01-01T00:00:00.000Z",
    "banReason": "string"
  }
}
\`\`\`

**Purpose:** Deactivates user account for policy violations.

---

### 🔒 PUT /admin/users/:id/unban
Unban a user account.

**Parameters:**
- `id` (path): User ID

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "isActive": true,
    "unbannedAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Reactivates a previously banned user account.

---

### 🔒 GET /admin/rides
Get all rides with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by ride status

**Response:**
\`\`\`json
{
  "success": true,
  "rides": [
    {
      "id": "string",
      "driverId": "string",
      "driver": {
        "firstName": "string",
        "lastName": "string",
        "vehicleModel": "string",
        "plateNumber": "string"
      },
      "passengers": [
        {
          "firstName": "string",
          "lastName": "string",
          "pricePaid": number
        }
      ],
      "vehicleType": "KEKE" | "CAR" | "BUS",
      "rideType": "SHARED" | "PRIVATE",
      "status": "PENDING" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T10:30:00.000Z",
      "totalAmount": number,
      "commission": number,
      "route": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
\`\`\`

**Purpose:** Provides comprehensive ride monitoring and management.

---

### 🔒 GET /admin/maintenance
Get maintenance requests.

**Query Parameters:**
- `status` (optional): Filter by maintenance status

**Response:**
\`\`\`json
{
  "success": true,
  "maintenanceRequests": [
    {
      "id": "string",
      "driverId": "string",
      "driver": {
        "firstName": "string",
        "lastName": "string",
        "vehicleModel": "string",
        "plateNumber": "string",
        "phone": "string"
      },
      "requestedDate": "2024-01-01T00:00:00.000Z",
      "approvedDate": "2024-01-01T00:00:00.000Z",
      "completedDate": "2024-01-01T00:00:00.000Z",
      "status": "REQUESTED" | "APPROVED" | "COMPLETED" | "OVERDUE",
      "description": "string",
      "cost": number,
      "approvedBy": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Manages vehicle maintenance requests and approvals.

---

### 🔒 PUT /admin/maintenance/:id/approve
Approve a maintenance request.

**Parameters:**
- `id` (path): Maintenance request ID

**Response:**
\`\`\`json
{
  "success": true,
  "maintenanceRequest": {
    "id": "string",
    "status": "APPROVED",
    "approvedDate": "2024-01-01T00:00:00.000Z",
    "approvedBy": "string"
  }
}
\`\`\`

**Purpose:** Approves maintenance requests for driver vehicles.

---

### 🔒 PUT /admin/config/commission
Set platform commission rate.

**Request Body:**
\`\`\`json
{
  "rate": number // Commission rate as decimal (e.g., 0.15 for 15%)
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "config": {
    "key": "commission_rate",
    "value": "0.15",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Updates the platform commission rate for rides.

---

### 🔒 GET /admin/config
Get system configuration.

**Response:**
\`\`\`json
{
  "success": true,
  "config": {
    "commission_rate": "0.15",
    "minimum_cashout": "1000",
    "ride_timeout": "900",
    "max_passengers_keke": "4",
    "max_passengers_car": "4",
    "max_passengers_bus": "14",
    "surge_pricing_enabled": "true",
    "maintenance_reminder_days": "30"
  }
}
\`\`\`

**Purpose:** Retrieves all system configuration parameters.

---

### 🔒 GET /admin/transactions
Get wallet transactions.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `userId` (optional): Filter by specific user

**Response:**
\`\`\`json
{
  "success": true,
  "transactions": [
    {
      "id": "string",
      "userId": "string",
      "user": {
        "firstName": "string",
        "lastName": "string",
        "phone": "string"
      },
      "amount": number,
      "type": "CREDIT" | "DEBIT" | "COMMISSION" | "CASHOUT" | "TOKEN_REWARD",
      "status": "PENDING" | "COMPLETED" | "FAILED",
      "description": "string",
      "reference": "string",
      "rideId": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}
\`\`\`

**Purpose:** Monitors all financial transactions on the platform.

## Admin Permissions

Admins can:
- **View all user data** and activity
- **Create driver accounts** with vehicle information
- **Ban/unban users** for policy violations
- **Monitor all rides** and transactions
- **Approve maintenance** requests
- **Configure system** parameters
- **Access financial** reports and analytics

## Error Responses

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Admin access required"
}
\`\`\`

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "Resource not found"
}
\`\`\`

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Invalid parameters"
}
\`\`\`

## Security Considerations

- All admin actions are logged for audit trails
- Sensitive operations require additional verification
- Rate limiting applies to bulk operations
- Data access follows privacy regulations
