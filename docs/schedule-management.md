# Schedule Management Endpoints

## Overview
Schedule management handles driver-posted schedules (primarily for KEKE rides) and passenger schedule discovery. Schedules allow drivers to post future rides that passengers can book in advance.

## Endpoints

### 🔒 POST /schedules
Create a new driver schedule.

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
    "seatsFilled": 0,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Allows drivers to post scheduled rides for passengers to book.

---

### 🌐 GET /schedules/matches
Find matching schedules for passengers.

**Query Parameters:**
- `startJunctionId` (required): Starting junction ID
- `endJunctionId` (required): Ending junction ID
- `windowMinutes` (optional): Time window in minutes (default: 30)

**Response:**
\`\`\`json
{
  "success": true,
  "matches": [
    {
      "id": "string",
      "driverId": "string",
      "driver": {
        "firstName": "string",
        "lastName": "string",
        "rating": number,
        "vehicleModel": "string",
        "plateNumber": "string",
        "profilePhotoUrl": "string"
      },
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
      "availableSeats": number,
      "estimatedPrice": number,
      "estimatedDuration": number,
      "timeUntilDeparture": "15 minutes",
      "isActive": true
    }
  ]
}
\`\`\`

**Purpose:** Helps passengers find available scheduled rides matching their route and time preferences.

---

### 🔒 GET /schedules/keke/schedules
Get available KEKE schedules for passengers.

**Response:**
\`\`\`json
{
  "success": true,
  "schedules": [
    {
      "id": "string",
      "driverId": "string",
      "driver": {
        "firstName": "string",
        "lastName": "string",
        "rating": number,
        "vehicleModel": "string",
        "plateNumber": "string"
      },
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
        },
        "basePrice": number,
        "estimatedTime": number
      },
      "departureTime": "2024-01-01T10:00:00.000Z",
      "capacity": number,
      "seatsFilled": number,
      "availableSeats": number,
      "status": "ACTIVE" | "FULL" | "DEPARTED",
      "bookingDeadline": "2024-01-01T09:45:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Lists all available KEKE schedules that passengers can book.

## Schedule Lifecycle

### 1. Creation
- Driver posts schedule with route and departure time
- System validates junction pair and timing
- Schedule becomes available for booking

### 2. Booking
- Passengers discover schedules via matching endpoints
- Seats are reserved when passengers confirm booking
- `seatsFilled` counter is updated

### 3. Departure
- Schedule becomes unavailable for new bookings
- Driver starts ride using validation codes
- Schedule status changes to "DEPARTED"

### 4. Completion
- Ride is completed normally
- Schedule is archived for historical data
- Ratings and feedback are collected

## Smart Scanning

The smart scan feature analyzes:
- **Historical demand** patterns for route/time combinations
- **Current passenger requests** matching the route
- **Optimal timing** based on traffic and demand
- **Pricing recommendations** for maximum occupancy

## Error Responses

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Departure time must be in the future"
}
\`\`\`

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "Junction not found"
}
\`\`\`

**409 Conflict:**
\`\`\`json
{
  "success": false,
  "message": "Driver already has a schedule at this time"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Driver profile required to create schedules"
}
\`\`\`

## Related Endpoints

- `POST /drivers/schedules` - Alternative schedule creation endpoint
- `GET /drivers/schedules` - Driver's own schedules
- `GET /passengers/schedules` - Passenger schedule discovery
- `GET /drivers/smartScan` - Optimization recommendations
