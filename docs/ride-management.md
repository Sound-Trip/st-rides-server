# Ride Management Endpoints

## Overview
Ride management endpoints handle the core ride lifecycle including ride details, acceptance, starting, completion, cancellation, confirmation, and rating.

## Endpoints

### 🔒 GET /rides/:id
Get detailed information about a specific ride.

**Parameters:**
- `id` (path): Ride ID

**Response:**
\`\`\`json
{
  "success": true,
  "ride": {
    "id": "string",
    "routeId": "string",
    "driverId": "string",
    "isChattered": "string",
    "rideType": "SHARED" | "PRIVATE",
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "status": "PENDING" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
    "pickupTime": "2024-01-01T10:00:00.000Z",
    "scheduledByDriver": boolean,
    "capacity": number,
    "seatsFilled": number,
    "requestedStartLat": number,
    "requestedStartLng": number,
    "requestedEndLat": number,
    "requestedEndLng": number,
    "startJunctionId": "string",
    "endJunctionId": "string",
    "scanCode": "string", // QR code for ride validation
    "shortCode": "string", // 4-digit code
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:00:00.000Z",
    "totalAmount": number,
    "commission": number,
    "driver": {
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "vehicleModel": "string",
      "plateNumber": "string",
      "rating": number
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
      "estimatedTime": number,
      "distance": number
    },
    "passengers": [
      {
        "id": "string",
        "passengerId": "string",
        "passenger": {
          "firstName": "string",
          "lastName": "string"
        },
        "paymentMethod": "WALLET" | "CASH" | "TOKEN",
        "pricePaid": number,
        "rated": boolean,
        "rating": number,
        "feedback": "string",
        "ticketCode": "string",
        "scanCode": "string"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Provides comprehensive ride information for tracking and management.

---

### 🔒 POST /rides/:requestId/accept
Driver accepts a ride request.

**Parameters:**
- `requestId` (path): Ride request ID

**Response:**
\`\`\`json
{
  "success": true,
  "ride": {
    "id": "string",
    "requestId": "string",
    "driverId": "string",
    "passengerId": "string",
    "status": "ACCEPTED",
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "rideType": "SHARED" | "PRIVATE",
    "scanCode": "string",
    "shortCode": "string",
    "estimatedPickupTime": "2024-01-01T10:05:00.000Z",
    "totalAmount": number,
    "commission": number
  }
}
\`\`\`

**Purpose:** Converts a ride request into an accepted ride with driver assignment.

---

### 🔒 POST /rides/:rideId/start
Start a ride using validation code.

**Parameters:**
- `rideId` (path): Ride ID

**Request Body:**
\`\`\`json
{
  "code": "string" // Scan code or short code from passenger
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "ride": {
    "id": "string",
    "status": "ONGOING",
    "startTime": "2024-01-01T10:00:00.000Z",
    "validatedPassengers": [
      {
        "passengerId": "string",
        "firstName": "string",
        "lastName": "string",
        "ticketCode": "string"
      }
    ]
  }
}
\`\`\`

**Purpose:** Validates passenger codes and officially starts the ride.

---

### 🌐 POST /rides/:rideId/complete
Complete a ride.

**Parameters:**
- `rideId` (path): Ride ID

**Response:**
\`\`\`json
{
  "success": true,
  "ride": {
    "id": "string",
    "status": "COMPLETED",
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T10:30:00.000Z",
    "totalAmount": number,
    "commission": number,
    "driverEarnings": number,
    "duration": "30 minutes",
    "passengers": [
      {
        "passengerId": "string",
        "pricePaid": number,
        "paymentMethod": "WALLET" | "CASH" | "TOKEN"
      }
    ]
  }
}
\`\`\`

**Purpose:** Marks ride as completed and processes payments.

---

### 🔒 POST /rides/:rideId/cancel
Cancel a ride.

**Parameters:**
- `rideId` (path): Ride ID

**Request Body:**
\`\`\`json
{
  "reason": "string" // Cancellation reason
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "ride": {
    "id": "string",
    "status": "CANCELLED",
    "cancellationReason": "string",
    "cancelledBy": "string",
    "cancelledAt": "2024-01-01T10:00:00.000Z",
    "refundAmount": number
  }
}
\`\`\`

**Purpose:** Cancels ride and processes any necessary refunds.

---

### 🌐 GET /rides/:rideId/code
Get ride validation codes.

**Parameters:**
- `rideId` (path): Ride ID

**Response:**
\`\`\`json
{
  "success": true,
  "codes": {
    "scanCode": "string", // QR code data
    "shortCode": "string", // 4-digit code
    "rideId": "string",
    "expiresAt": "2024-01-01T10:15:00.000Z"
  }
}
\`\`\`

**Purpose:** Provides validation codes for ride verification.

---

### 🔒 POST /rides/:rideId/confirm
Passenger confirms and locks their seat in a ride.

**Parameters:**
- `rideId` (path): Ride ID

**Response:**
\`\`\`json
{
  "success": true,
  "confirmation": {
    "rideId": "string",
    "passengerId": "string",
    "ticketCode": "string",
    "scanCode": "string",
    "paymentMethod": "WALLET" | "CASH" | "TOKEN",
    "pricePaid": number,
    "seatNumber": number,
    "confirmedAt": "2024-01-01T10:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Secures passenger's seat and generates their validation codes.

---

### 🔒 POST /rides/:rideId/rate
Rate a completed ride.

**Parameters:**
- `rideId` (path): Ride ID

**Request Body:**
\`\`\`json
{
  "rating": number, // 1-5 stars
  "feedback": "string" // Optional feedback
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "rating": {
    "rideId": "string",
    "rating": number,
    "feedback": "string",
    "ratedAt": "2024-01-01T10:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Allows passengers to rate their ride experience (implementation pending).

## Alternative Ride Endpoints (bin/rides)

### 🔒 POST /rides/book
Book a ride directly (alternative booking method).

**Request Body:**
\`\`\`json
{
  "routeId": "string",
  "pickupTime": "2024-01-01T10:00:00.000Z",
  "vehicleType": "KEKE" | "CAR" | "BUS",
  "paymentMethod": "WALLET" | "CASH" | "TOKEN"
}
\`\`\`

**Purpose:** Direct ride booking for scheduled routes.

---

### 🔒 POST /rides/:scanCode/start
Start ride using scan code (alternative method).

**Parameters:**
- `scanCode` (path): Ride scan code

**Purpose:** Alternative ride start method using scan code in URL.

---

### 🔒 GET /rides/passenger
Get passenger's ride history.

**Query Parameters:**
- `status` (optional): Filter by ride status

**Purpose:** Lists rides for the authenticated passenger.

---

### 🔒 GET /rides/driver
Get driver's ride history.

**Query Parameters:**
- `status` (optional): Filter by ride status

**Purpose:** Lists rides for the authenticated driver.

---

### 🔒 GET /rides/driver/recommendations
Get ride recommendations for driver.

**Purpose:** AI-powered ride recommendations based on driver patterns.

## Error Responses

**404 Not Found:**
\`\`\`json
{
  "success": false,
  "message": "Ride not found"
}
\`\`\`

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Invalid validation code"
}
\`\`\`

**409 Conflict:**
\`\`\`json
{
  "success": false,
  "message": "Ride already started"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Not authorized to perform this action"
}
