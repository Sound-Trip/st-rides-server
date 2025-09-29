# Request Management Endpoints

## Overview
Request management handles ride requests from passengers. These are immediate or future ride needs that drivers can discover and accept, converting them into actual rides.

## Endpoints

### 🔒 POST /requests
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
    "status": "PENDING",
    
    // Location information
    "startJunctionId": "string",
    "endJunctionId": "string",
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
    "startLat": number,
    "startLng": number,
    "endLat": number,
    "endLng": number,
    
    // Request details
    "scheduledFor": "2024-01-01T10:00:00.000Z",
    "seatsNeeded": number,
    "priceQuoted": number,
    "expiresAt": "2024-01-01T10:15:00.000Z", // Auto-expiry time
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
\`\`\`

**Purpose:** Creates a ride request that drivers can discover and accept through the matching system.

## Request Lifecycle

### 1. Creation (PENDING)
- Passenger submits ride request
- System validates location and vehicle type requirements
- Request enters matching pool with expiry timer

### 2. Matching (MATCHING)
- System notifies nearby drivers
- Request appears in driver's nearby requests feed
- Price quote is calculated based on distance/demand

### 3. Acceptance (ACCEPTED)
- Driver accepts the request
- Request is converted to a Ride entity
- Passenger is notified of driver assignment

### 4. Expiry/Cancellation
- **EXPIRED**: No driver accepts within time limit
- **CANCELLED**: Passenger cancels before acceptance

## Request Types

### KEKE Requests
- **Junction-based routing**: Must specify valid junction pairs
- **Shared rides**: Multiple passengers can join
- **Fixed pricing**: Based on predefined route prices
- **Schedule matching**: Can match with driver schedules

### CAR/BUS Requests
- **Free-form locations**: GPS coordinates for pickup/dropoff
- **Private or shared**: Passenger chooses ride type
- **Dynamic pricing**: Based on distance, time, and demand
- **Real-time matching**: Immediate driver assignment

## Validation Rules

### KEKE Rides
\`\`\`json
{
  "vehicleType": "KEKE",
  "rideType": "SHARED", // Always shared for KEKE
  "startJunctionId": "required",
  "endJunctionId": "required"
  // startLat, startLng, endLat, endLng not allowed
}
\`\`\`

### CAR/BUS Rides
\`\`\`json
{
  "vehicleType": "CAR" | "BUS",
  "rideType": "SHARED" | "PRIVATE",
  "startLat": "required",
  "startLng": "required", 
  "endLat": "required",
  "endLng": "required"
  // startJunctionId, endJunctionId not allowed
}
\`\`\`

## Matching Algorithm

The system matches requests based on:

1. **Vehicle Type**: Exact match required
2. **Location Proximity**: Within driver's service radius
3. **Time Compatibility**: Immediate or scheduled timing
4. **Capacity**: Available seats for shared rides
5. **Driver Preferences**: Route preferences and ratings

## Error Responses

**400 Bad Request:**
\`\`\`json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "startJunctionId is required for KEKE rides",
    "rideType must be SHARED for KEKE vehicles"
  ]
}
\`\`\`

**422 Unprocessable Entity:**
\`\`\`json
{
  "success": false,
  "message": "Invalid location coordinates"
}
\`\`\`

**409 Conflict:**
\`\`\`json
{
  "success": false,
  "message": "You already have a pending request"
}
\`\`\`

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Passenger profile required"
}
\`\`\`

## Related Endpoints

- `GET /drivers/nearby-requests` - Driver discovery of requests
- `POST /rides/:requestId/accept` - Driver accepts request
- `POST /passengers/ride-requests` - Alternative request creation
- `GET /passengers/ride-requests` - Request history
