# Driver Endpoints

## Overview
Driver endpoints handle driver-specific operations including location updates, schedule management, ride request discovery, and smart scanning for optimal routes.

## Endpoints

### 🔒 PATCH /drivers/me/location
Update driver's current location and availability status.

**Request Body:**
\`\`\`json
{
  "lat": number, // Latitude (-90 to 90)
  "lng": number, // Longitude (-180 to 180)
  "isOnline": boolean,
  "isAvailable": boolean // Optional, defaults to true when online
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "location": {
    "lat": number,
    "lng": number,
    "isOnline": boolean,
    "isAvailable": boolean,
    "lastPingAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Updates driver's real-time location for ride matching and tracking.

---

### 🌐 GET /drivers/nearby-requests
Find nearby ride requests for drivers.

**Query Parameters:**
- `vehicleType` (required): "KEKE" | "CAR" | "BUS"
- `lat` (required): Driver's latitude
- `lng` (required): Driver's longitude  
- `radiusMeters` (optional): Search radius in meters (default: 3000)

**Response:**
\`\`\`json
{
  "success": true,
  "requests": [
    {
      "id": "string",
      "passengerId": "string",
      "passenger": {
        "firstName": "string",
        "lastName": "string",
        "rating": number
      },
      "vehicleType": "KEKE" | "CAR" | "BUS",
      "rideType": "SHARED" | "PRIVATE",
      "startJunctionId": "string", // For KEKE
      "endJunctionId": "string", // For KEKE
      "startLat": number, // For CAR/BUS
      "startLng": number, // For CAR/BUS
      "endLat": number, // For CAR/BUS
      "endLng": number, // For CAR/BUS
      "seatsNeeded": number,
      "priceQuoted": number,
      "distance": number, // Distance from driver
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Helps drivers discover nearby ride requests they can accept.

---

### 🔒 POST /drivers/schedules
Create a new driver schedule (KEKE only).

**Request Body:**
\`\`\`json
{
  "startJunctionId": "string",
  "endJunctionId": "string", 
  "departureTime": "2024-01-01T10:00:00.000Z",
  "capacity": number // Default: 4, minimum: 1
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "schedule": {
    "id": "string",
    "driverId": "string",
    "vehicleType": "KEKE",
    "startJunctionId": "string",
    "endJunctionId": "string",
    "startJunction": {
      "id": "string",
      "name": "string",
      "lat": number,
      "lng": number
    },
    "endJunction": {
      "id": "string", 
      "name": "string",
      "lat": number,
      "lng": number
    },
    "departureTime": "2024-01-01T10:00:00.000Z",
    "capacity": number,
    "seatsFilled": number,
    "isActive": boolean,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Allows KEKE drivers to post scheduled rides for passengers to book.

---

### 🔒 GET /drivers/schedules
Get driver's posted schedules.

**Response:**
\`\`\`json
{
  "success": true,
  "schedules": [
    {
      "id": "string",
      "startJunction": {
        "name": "string",
        "lat": number,
        "lng": number
      },
      "endJunction": {
        "name": "string",
        "lat": number, 
        "lng": number
      },
      "departureTime": "2024-01-01T10:00:00.000Z",
      "capacity": number,
      "seatsFilled": number,
      "isActive": boolean,
      "passengers": [
        {
          "id": "string",
          "firstName": "string",
          "lastName": "string"
        }
      ]
    }
  ]
}
\`\`\`

**Purpose:** Lists all schedules created by the authenticated driver.

---

### 🔒 PATCH /drivers/schedules/:id
Update a driver schedule.

**Parameters:**
- `id` (path): Schedule ID

**Purpose:** Modify existing schedule details (implementation pending).

---

### 🔒 DELETE /drivers/schedules/:id
Delete a driver schedule.

**Parameters:**
- `id` (path): Schedule ID

**Purpose:** Remove a posted schedule (implementation pending).

---

### 🔒 GET /drivers/smartScan
Smart scan for optimal ride opportunities.

**Query Parameters:**
- `startJunctionId` (required): Starting junction ID
- `endJunctionId` (required): Ending junction ID
- `windowMinutes` (optional): Time window in minutes (default: 30)

**Response:**
\`\`\`json
{
  "success": true,
  "opportunities": [
    {
      "type": "schedule" | "request",
      "id": "string",
      "departureTime": "2024-01-01T10:00:00.000Z",
      "passengers": number,
      "estimatedEarnings": number,
      "route": {
        "startJunction": {
          "name": "string",
          "lat": number,
          "lng": number
        },
        "endJunction": {
          "name": "string",
          "lat": number,
          "lng": number
        }
      }
    }
  ]
}
\`\`\`

**Purpose:** Analyzes route demand and suggests optimal ride opportunities within a time window.

## Error Responses

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Invalid location coordinates"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Driver profile required"
}
\`\`\`

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "Schedule not found"
}
