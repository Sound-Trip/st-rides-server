# User Management Endpoints

## Overview
User management endpoints handle basic user operations like retrieving user information, updating profiles, and account management.

## Endpoints

### 🔒 GET /users/:id
Get user information by ID.

**Parameters:**
- `id` (path): User ID

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string",
    "role": "PASSENGER" | "DRIVER" | "ADMIN" | "SUPPORT_AGENT",
    "isActive": boolean,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "driverProfile": {}, // If role is DRIVER
    "passengerProfile": {} // If role is PASSENGER
  }
}
\`\`\`

**Purpose:** Retrieves detailed user information including role-specific profiles.

---

### 🔒 PATCH /users/me
Update current user's profile.

**Query Parameters:**
- `id` (query): User ID

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "phone": "string",
    "email": "string"
  }
}
\`\`\`

**Purpose:** Updates the authenticated user's profile information.

**Note:** Currently returns user data (implementation may need completion).

---

### 🔒 DELETE /users/me
Delete current user's account.

**Query Parameters:**
- `id` (query): User ID

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Account deleted successfully"
}
\`\`\`

**Purpose:** Soft deletes or deactivates the user's account.

**Note:** Currently returns user data (implementation may need completion).

## Error Responses

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "User not found"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Access denied"
}
