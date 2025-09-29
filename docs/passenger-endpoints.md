# Passenger Endpoints

## Overview
Passenger endpoints handle passenger-specific operations including profile management, ride requests, schedule viewing, and chartered ride services.

## Endpoints

### 🔒 GET /passengers/me
Get current passenger's profile information.

**Response:**
\`\`\`json
{
  "success": true,
  "passenger": {
    "userId": "string",
    "profilePhotoUrl": "string",
    "walletBalance": number,
    "earnedTokens": number,
    "rating": number,
    "totalRides": number,
    "user": {
      "firstName": "string",
      "lastName": "string",
      "phone": "string",
      "email": "string"
    }
  }
}
\`\`\`

**Purpose:** Retrieves the authenticated passenger's profile and statistics.

---

### 🔒 GET /passengers/schedules
View available KEKE schedules for booking.

**Query Parameters:**
- `startJunctionId` (required): Starting junction ID
- `endJunctionId` (required): Ending junction ID
- `windowMinutes` (optional): Time window in minutes (default: 30)

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
      "estimatedPrice": number
    }
  ]
}
\`\`\`

**Purpose:** Shows available KEKE schedules matching passenger's route and time preferences.

---

### 🔒 POST /passengers/ride-requests
Create a new ride request.

**Request Body:**
\`\`\`json
{
  "vehicleType": "KEKE" | "CAR" | "BUS",
  "rideType": "SHARED" | "PRIVATE",
  
  // For KEKE rides (junction-to-junction)
  "startJunctionId": "string", // Required if vehicleType is KEKE
  "endJunctionId": "string", // Required if vehicleType is KEKE
  
  // For CAR/BUS rides (free-form locations)
  "startLat": number, // Required if vehicleType is not KEKE
  "startLng": number, // Required if vehicleType is not KEKE
  "endLat": number, // Required if vehicleType is not KEKE
  "endLng": number, // Required if vehicleType is not KEKE
  
  "scheduledFor": "2024-01-01T10:00:00.000Z", // Optional, for future rides
  "seatsNeeded": number // Optional, default: 1
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "request": {
    "id": "string",
    "passengerId": "string",
    "vehicleType": "KEKE" | "CAR" | "BUS",
    "rideType": "SHARED" | "PRIVATE",
    "status": "PENDING" | "MATCHING" | "ACCEPTED" | "EXPIRED" | "CANCELLED",
    "startJunctionId": "string",
    "endJunctionId": "string",
    "startLat": number,
    "startLng": number,
    "endLat": number,
    "endLng": number,
    "scheduledFor": "2024-01-01T10:00:00.000Z",
    "seatsNeeded": number,
    "priceQuoted": number,
    "expiresAt": "2024-01-01T10:15:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Creates a ride request that drivers can discover and accept.

---

### 🔒 GET /passengers/ride-requests
Get passenger's ride request history.

**Response:**
\`\`\`json
{
  "success": true,
  "requests": [
    {
      "id": "string",
      "vehicleType": "KEKE" | "CAR" | "BUS",
      "rideType": "SHARED" | "PRIVATE", 
      "status": "PENDING" | "MATCHING" | "ACCEPTED" | "EXPIRED" | "CANCELLED",
      "startLocation": "string",
      "endLocation": "string",
      "scheduledFor": "2024-01-01T10:00:00.000Z",
      "priceQuoted": number,
      "acceptedRideId": "string",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Lists all ride requests made by the passenger.

---

### 🔒 DELETE /passengers/ride-requests/:id
Cancel a ride request.

**Parameters:**
- `id` (path): Ride request ID

**Purpose:** Cancels a pending ride request (implementation pending).

---

### 🔒 POST /passengers/chatter
Create a chartered ride request.

**Request Body:**
\`\`\`json
{
  "vehicleType": "CAR" | "BUS", // KEKE not supported for charter
  "rideType": "PRIVATE",
  "startLat": number,
  "startLng": number,
  "endLat": number,
  "endLng": number,
  "scheduledFor": "2024-01-01T10:00:00.000Z", // Optional
  "seatsNeeded": number
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "charteredRide": {
    "id": "string",
    "passengerId": "string",
    "vehicleType": "CAR" | "BUS",
    "rideType": "PRIVATE",
    "isChattered": "true",
    "startLat": number,
    "startLng": number,
    "endLat": number,
    "endLng": number,
    "scheduledFor": "2024-01-01T10:00:00.000Z",
    "seatsNeeded": number,
    "status": "PENDING",
    "priceQuoted": number,
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Creates a chartered (private) ride request with premium pricing.

---

### 🔒 GET /passengers/chatter
Get passenger's chartered ride history.

**Response:**
\`\`\`json
{
  "success": true,
  "charteredRides": [
    {
      "id": "string",
      "vehicleType": "CAR" | "BUS",
      "status": "PENDING" | "ACCEPTED" | "ONGOING" | "COMPLETED" | "CANCELLED",
      "startLocation": "string",
      "endLocation": "string",
      "scheduledFor": "2024-01-01T10:00:00.000Z",
      "priceQuoted": number,
      "driver": {
        "firstName": "string",
        "lastName": "string",
        "vehicleModel": "string",
        "plateNumber": "string"
      },
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Lists all chartered rides requested by the passenger.

## Error Responses

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Invalid vehicle type for charter service"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Passenger profile required"
}
\`\`\`

**422 Unprocessable Entity:**
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "startJunctionId is required for KEKE rides",
    "startLat is required for CAR/BUS rides"
  ]
}
