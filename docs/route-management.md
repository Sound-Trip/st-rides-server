# Route Management Endpoints

## Overview
Route management handles predefined routes between locations, supporting both junction-based routes (for KEKE) and free-form routes (for CAR/BUS). Routes define pricing, estimated time, and distance information.

## Endpoints

### 🌐 GET /routes
Get all available routes.

**Query Parameters:**
- `vehicleType` (optional): Filter by "KEKE" | "CAR" | "BUS"

**Response:**
\`\`\`json
{
  "success": true,
  "routes": [
    {
      "id": "string",
      "vehicleType": "KEKE" | "CAR" | "BUS",
      "basePrice": number,
      "estimatedTime": number, // in minutes
      "distance": number, // in kilometers
      "isActive": boolean,
      
      // For KEKE routes (junction-to-junction)
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
      
      // For CAR/BUS routes (free-form locations)
      "startLat": number,
      "startLng": number,
      "endLat": number,
      "endLng": number,
      
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Lists all available routes for ride planning and booking.

---

### 🌐 GET /routes/popular
Get popular routes based on usage.

**Query Parameters:**
- `limit` (optional): Number of routes to return (default: 10)

**Response:**
\`\`\`json
{
  "success": true,
  "popularRoutes": [
    {
      "id": "string",
      "vehicleType": "KEKE" | "CAR" | "BUS",
      "routeName": "string", // e.g., "Junction A to Junction B"
      "basePrice": number,
      "estimatedTime": number,
      "distance": number,
      "rideCount": number, // Total rides on this route
      "averageRating": number,
      "startLocation": {
        "name": "string",
        "lat": number,
        "lng": number
      },
      "endLocation": {
        "name": "string",
        "lat": number,
        "lng": number
      }
    }
  ]
}
\`\`\`

**Purpose:** Shows most frequently used routes for quick booking options.

---

### 🌐 GET /routes/:id
Get detailed information about a specific route.

**Parameters:**
- `id` (path): Route ID

**Response:**
\`\`\`json
{
  "success": true,
  "route": {
    "id": "string",
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "basePrice": number,
    "estimatedTime": number,
    "distance": number,
    "isActive": boolean,
    "startJunctionId": "string",
    "endJunctionId": "string",
    "startLat": number,
    "startLng": number,
    "endLat": number,
    "endLng": number,
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
    "statistics": {
      "totalRides": number,
      "averageRating": number,
      "averageDuration": number,
      "peakHours": ["string"], // e.g., ["08:00", "17:00"]
      "averageWaitTime": number
    },
    "assignedDrivers": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "vehicleModel": "string",
        "plateNumber": "string",
        "rating": number,
        "isOnline": boolean
      }
    ]
  }
}
\`\`\`

**Purpose:** Provides comprehensive route information including statistics and assigned drivers.

---

### 🔒 POST /routes
Create a new route (Admin only).

**Request Body:**
\`\`\`json
{
  "startLocation": "string", // Junction name or address
  "endLocation": "string", // Junction name or address
  "type": "KEKE" | "CAR" | "BUS",
  "basePrice": number,
  "distance": number, // Optional, in kilometers
  "estimatedTime": number // Optional, in minutes
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "route": {
    "id": "string",
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "basePrice": number,
    "estimatedTime": number,
    "distance": number,
    "isActive": true,
    "startLocation": "string",
    "endLocation": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Allows administrators to create new routes in the system.

---

### 🔒 PUT /routes/:id
Update an existing route (Admin only).

**Parameters:**
- `id` (path): Route ID

**Request Body:**
\`\`\`json
{
  "startLocation": "string", // Optional
  "endLocation": "string", // Optional
  "basePrice": number, // Optional
  "distance": number, // Optional
  "estimatedTime": number, // Optional
  "isActive": boolean // Optional
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "route": {
    "id": "string",
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "basePrice": number,
    "estimatedTime": number,
    "distance": number,
    "isActive": boolean,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Allows administrators to modify route details and pricing.

---

### 🔒 DELETE /routes/:id
Delete a route (Admin only).

**Parameters:**
- `id` (path): Route ID

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Route deleted successfully"
}
\`\`\`

**Purpose:** Removes a route from the system (soft delete recommended).

## Route Types

### KEKE Routes
- **Junction-based**: Use `startJunctionId` and `endJunctionId`
- **Fixed pricing**: Standardized fares between junction pairs
- **Shared rides**: Multiple passengers per trip
- **Scheduled**: Support driver-posted schedules

### CAR/BUS Routes
- **Free-form**: Use `startLat`, `startLng`, `endLat`, `endLng`
- **Dynamic pricing**: Based on distance and demand
- **Private/Shared**: Support both ride types
- **On-demand**: Real-time matching

## Error Responses

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "Route not found"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Admin access required"
}
\`\`\`

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Invalid route parameters"
}
\`\`\`

**409 Conflict:**
\`\`\`json
{
  "success": false,
  "message": "Route already exists between these locations"
}
