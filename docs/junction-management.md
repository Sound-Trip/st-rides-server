# Junction Management Endpoints

## Overview
Junction endpoints manage the predefined pickup/dropoff points used primarily for KEKE rides. Junctions represent fixed locations with coordinates that form the basis of the route network.

## Endpoints

### 🔒 GET /junctions
Get all available junctions.

**Response:**
\`\`\`json
{
  "success": true,
  "junctions": [
    {
      "id": "string",
      "name": "string",
      "lat": number,
      "lng": number,
      "activeRoutes": number, // Number of active routes using this junction
      "popularityScore": number, // Usage frequency score
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
\`\`\`

**Purpose:** Provides all junction points for route planning and ride booking.

## Data Model

Junctions are core infrastructure elements that:

- **Define fixed pickup/dropoff points** for KEKE rides
- **Enable route creation** between junction pairs
- **Support schedule matching** for driver-passenger connections
- **Provide geographic references** for location-based services

## Usage in Other Endpoints

Junctions are referenced in:

- **Driver Schedules**: `startJunctionId` and `endJunctionId`
- **Ride Requests**: For KEKE rides requiring junction-to-junction travel
- **Route Definitions**: As start and end points for predefined routes
- **Smart Scanning**: For finding optimal junction-based opportunities

## Error Responses

**403 Forbidden:**
\`\`\`json
{
  "success": false,
  "message": "Authentication required"
}
\`\`\`

**500 Internal Server Error:**
\`\`\`json
{
  "success": false,
  "message": "Failed to retrieve junctions"
}
\`\`\`

## Related Endpoints

- `GET /drivers/smartScan` - Uses junctions for route optimization
- `GET /passengers/schedules` - Filters schedules by junction pairs
- `POST /drivers/schedules` - Creates schedules between junctions
- `POST /passengers/ride-requests` - For KEKE rides between junctions
