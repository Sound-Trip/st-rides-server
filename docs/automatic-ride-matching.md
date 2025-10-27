# Automatic Ride Matching System

## Overview

The Automatic Ride Matching System is a background service that intelligently matches pending passenger ride requests to driver schedules every 2 minutes. When no immediate match is found, it groups similar requests and notifies drivers, enabling them to accept multiple requests at once.

## Architecture

### Components

1. **RideMatcherService** (`src/rides/ride-matcher.service.ts`)
   - Runs every 2 minutes via NestJS scheduler
   - Handles automatic matching and grouping logic
   - Manages driver notifications

2. **RidesService** (`src/rides/rides.service.ts`)
   - `acceptGroupedRequests()` - Accepts multiple grouped requests at once
   - Existing methods remain unchanged

3. **RidesController** (`src/rides/rides.controller.ts`)
   - New endpoint: `POST /rides/grouped/accept`

## Workflow

### Phase 1: Automatic Matching (Every 2 Minutes)

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 1. Fetch all PENDING ride requests (KEKE, SHARED)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. For each request, find matching driver schedule:         │
│    - Same start/end junction                                │
│    - Departure time within 15 mins before to 5 mins after   │
│    - Has available seats (< 4)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    ↓                ↓
            ✅ MATCH FOUND      ❌ NO MATCH
                    ↓                ↓
            Auto-add to ride    Check elapsed time
            Create ride if      (15 mins threshold)
            needed
            Notify passenger
\`\`\`

### Phase 2: Grouping & Driver Notification (After 15 Minutes)

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 1. Find similar pending requests:                           │
│    - Same start/end junction                                │
│    - Scheduled time within 10-min window (±5 mins)          │
│    - Status: PENDING                                        │
│    - Not yet accepted                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Send notifications to all online KEKE drivers:           │
│    - Title: "N Passengers Waiting"                          │
│    - Body: Route and passenger count                        │
│    - Metadata: Request IDs, junction info, scheduled time   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Mark requests as MATCHING to prevent duplicate notifs    │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Phase 3: Driver Acceptance

\`\`\`
Driver receives notification
        ↓
Driver clicks notification
        ↓
Driver calls: POST /rides/grouped/accept
        ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Validate all requests have same start/end junction       │
│ 2. Create driver schedule (if not chattered)                │
│ 3. Create single ride for all passengers                    │
│ 4. Add passengers to ride (up to capacity of 4)             │
│ 5. Update request statuses to ACCEPTED                      │
│ 6. Notify all passengers of acceptance                      │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## API Endpoints

### Accept Grouped Requests

**Endpoint:** `POST /rides/grouped/accept`

**Authentication:** Required (JWT)

**Request Body:**
\`\`\`json
{
  "requestIds": ["req-id-1", "req-id-2", "req-id-3"]
}
\`\`\`

**Response:**
\`\`\`json
{
  "ride": {
    "id": "ride-123",
    "driverId": "driver-456",
    "vehicleType": "KEKE",
    "rideType": "SHARED",
    "status": "SCHEDULED",
    "capacity": 4,
    "seatsFilled": 3,
    "pickupTime": "2025-10-26T14:30:00Z",
    "startJunctionId": "junction-1",
    "endJunctionId": "junction-2"
  },
  "driverSchedule": {
    "id": "schedule-789",
    "driverId": "driver-456",
    "departureTime": "2025-10-26T14:30:00Z",
    "seatsFilled": 3
  },
  "acceptedRequestIds": ["req-id-1", "req-id-2", "req-id-3"],
  "ridePassengers": [
    {
      "id": "rp-1",
      "rideId": "ride-123",
      "passengerId": "passenger-1",
      "ticketCode": "4521",
      "scanCode": "8934"
    }
  ]
}
\`\`\`

**Error Responses:**
- `400 Bad Request` - No valid requests found or requests have different junctions
- `401 Unauthorized` - Missing or invalid JWT token

## Database Schema

### Relevant Models

**RideRequest**
- `status`: PENDING → MATCHING → ACCEPTED
- `acceptedRideId`: Links to created Ride
- `createdAt`: Used to calculate 15-min threshold

**Ride**
- `scheduledByDriver`: true for auto-matched rides
- `seatsFilled`: Incremented as passengers are added
- `capacity`: 4 for KEKE

**DriverSchedule**
- `seatsFilled`: Incremented as passengers are added
- `isActive`: Must be true to match

**Notification**
- `metadata`: Contains grouped request IDs and route info

## Configuration

### Cron Schedule
- **Frequency:** Every 2 minutes
- **Expression:** `EVERY_2_MINUTES` (NestJS ScheduleModule)

### Matching Criteria
- **Time Window:** 15 minutes before to 5 minutes after scheduled time
- **Grouping Window:** ±5 minutes around base request time
- **Elapsed Time Threshold:** 15 minutes before grouping
- **Vehicle Type:** KEKE only
- **Ride Type:** SHARED only
- **Capacity:** 4 seats per KEKE

## Future Enhancements

1. **Location-Based Filtering**
   - Filter drivers by proximity to pickup location
   - Use driver's current lat/lng to calculate distance

2. **Surge Pricing**
   - Increase pricing when multiple requests are grouped
   - Incentivize drivers to accept grouped requests

3. **Passenger Preferences**
   - Allow passengers to opt-in/out of auto-matching
   - Preferred driver ratings or vehicle types

4. **Analytics**
   - Track matching success rate
   - Monitor average wait time before grouping
   - Driver acceptance rate for grouped requests

5. **Smart Grouping**
   - Group by passenger proximity, not just time
   - Optimize route efficiency
   - Consider passenger ratings

## Logging

The service logs important events:

\`\`\`
[RideMatcherService] Starting automatic ride matching...
[RideMatcherService] Found 5 pending requests
[RideMatcherService] ✅ Request req-123 matched to schedule sch-456
[RideMatcherService] 📢 Grouping 3 similar requests and notifying drivers
[RideMatcherService] 📢 Notifying 12 drivers about grouped requests
[RideMatcherService] Ride matching cycle completed
\`\`\`

## Error Handling

- **No matching schedule:** Request waits for next cycle or 15-min threshold
- **Duplicate passenger:** Skipped if already in ride
- **Capacity full:** Request not added, remains PENDING
- **Invalid requests:** Logged and skipped, cycle continues

## Testing

### Manual Testing Steps

1. **Create pending requests:**
   \`\`\`bash
   POST /passengers/ride-requests
   {
     "startJunctionId": "junction-1",
     "endJunctionId": "junction-2",
     "vehicleType": "KEKE"
   }
   \`\`\`

2. **Create driver schedule:**
   \`\`\`bash
   POST /drivers/schedules
   {
     "startJunctionId": "junction-1",
     "endJunctionId": "junction-2",
     "departureTime": "2025-10-26T14:30:00Z",
     "capacity": 4
   }
   \`\`\`

3. **Wait 2 minutes** for automatic matching

4. **Check notifications** - Passengers should receive "Ride Matched!" notification

5. **For unmatched requests** - Wait 15 minutes, drivers should receive grouped notification

6. **Accept grouped requests:**
   \`\`\`bash
   POST /rides/grouped/accept
   {
     "requestIds": ["req-1", "req-2", "req-3"]
   }
   \`\`\`

## Performance Considerations

- **Query Optimization:** Indexes on `status`, `vehicleType`, `rideType`, `startJunctionId`, `endJunctionId`
- **Transaction Safety:** All operations wrapped in Prisma transactions
- **Notification Batching:** Consider batching notifications in future versions
- **Cron Frequency:** 2-minute interval balances responsiveness vs. database load

## Related Flows

- **Manual Driver Acceptance:** `POST /rides/:requestId/accept`
- **Smart Scan:** `GET /drivers/smart-scan` (manual search by driver)
- **Passenger Request Creation:** `POST /passengers/ride-requests`
- **Driver Schedule Creation:** `POST /drivers/schedules`
