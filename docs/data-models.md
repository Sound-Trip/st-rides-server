# Data Models

## Overview
This document describes the core data models used in the ST Rides platform, based on the Prisma schema. Understanding these models is essential for working with the API endpoints.

## Core Enums

### UserRole
\`\`\`typescript
enum UserRole {
  PASSENGER = "PASSENGER"
  DRIVER = "DRIVER"
  ADMIN = "ADMIN"
  SUPPORT_AGENT = "SUPPORT_AGENT"
}
\`\`\`

### VehicleType
\`\`\`typescript
enum VehicleType {
  KEKE = "KEKE"    // Tricycle/Auto-rickshaw
  CAR = "CAR"      // Private car
  BUS = "BUS"      // Mini-bus/Bus
}
\`\`\`

### RideStatus
\`\`\`typescript
enum RideStatus {
  PENDING = "PENDING"
  SCHEDULED = "SCHEDULED"
  ONGOING = "ONGOING"
  COMPLETED = "COMPLETED"
  CANCELLED = "CANCELLED"
}
\`\`\`

### RideType
\`\`\`typescript
enum RideType {
  SHARED = "SHARED"    // Multiple passengers
  PRIVATE = "PRIVATE"  // Single passenger/group
}
\`\`\`

### PaymentMethod
\`\`\`typescript
enum PaymentMethod {
  WALLET = "WALLET"  // Platform wallet
  CASH = "CASH"      // Cash payment
  TOKEN = "TOKEN"    // Loyalty tokens
}
\`\`\`

### TransactionType
\`\`\`typescript
enum TransactionType {
  CREDIT = "CREDIT"           // Money added
  DEBIT = "DEBIT"            // Money deducted
  COMMISSION = "COMMISSION"   // Platform fee
  CASHOUT = "CASHOUT"        // Withdrawal
  TOKEN_REWARD = "TOKEN_REWARD" // Token earnings
}
\`\`\`

### RideRequestStatus
\`\`\`typescript
enum RideRequestStatus {
  PENDING = "PENDING"      // Waiting for driver
  MATCHING = "MATCHING"    // System finding driver
  ACCEPTED = "ACCEPTED"    // Driver accepted
  EXPIRED = "EXPIRED"      // Timeout reached
  CANCELLED = "CANCELLED"  // User cancelled
}
\`\`\`

## Core Models

### User
The base user model for all platform users.

\`\`\`typescript
interface User {
  id: string                    // Unique identifier
  firstName: string             // User's first name
  lastName: string              // User's last name
  phone?: string                // Phone number (unique)
  email?: string                // Email address (unique)
  passwordHash?: string         // Hashed password
  role: UserRole               // User role
  isActive: boolean            // Account status
  createdAt: Date              // Registration date
  updatedAt: Date              // Last update
  
  // Relations
  driverProfile?: DriverProfile
  passengerProfile?: PassengerProfile
  ridesAsDriver: Ride[]
  ridePassengers: RidePassenger[]
  rideRequests: RideRequest[]
  driverSchedules: DriverSchedule[]
  walletTransactions: WalletTransaction[]
  maintenanceRequests: MaintenanceRequest[]
  notifications: Notification[]
  otpCodes: OtpCode[]
}
\`\`\`

### DriverProfile
Extended profile for driver users.

\`\`\`typescript
interface DriverProfile {
  userId: string                // Links to User.id
  vehicleType: VehicleType     // Type of vehicle
  vehicleModel: string         // Vehicle model/make
  plateNumber: string          // License plate
  busVariantId?: string        // For bus capacity variants
  licenseNumber: string        // Driver's license
  profilePhotoUrl?: string     // Profile image
  assignedRouteId?: string     // Preferred route
  isCompanyVehicle: boolean    // Company vs personal vehicle
  lastMaintenanceDate?: Date   // Last service date
  maintenanceDueDate?: Date    // Next service due
  isBlocked: boolean           // Account restriction
  walletBalance: Decimal       // Current earnings
  totalEarnings: Decimal       // Lifetime earnings
  rating?: Decimal             // Average rating (1-5)
  totalRides: number           // Completed rides count
  isOnline: boolean            // Currently available
  isAvailable: boolean         // Not on active ride
  currentLat?: number          // Current latitude
  currentLng?: number          // Current longitude
  lastPingAt?: Date           // Last location update
  createdAt: Date
  updatedAt: Date
}
\`\`\`

### PassengerProfile
Extended profile for passenger users.

\`\`\`typescript
interface PassengerProfile {
  userId: string               // Links to User.id
  profilePhotoUrl?: string     // Profile image
  walletBalance: Decimal       // Current wallet balance
  earnedTokens: number         // Loyalty tokens
  rating?: Decimal             // Average rating (1-5)
  totalRides: number           // Completed rides count
  createdAt: Date
  updatedAt: Date
}
\`\`\`

### Junction
Fixed pickup/dropoff points for KEKE rides.

\`\`\`typescript
interface Junction {
  id: string                   // Unique identifier
  name: string                 // Junction name (unique)
  lat: number                  // Latitude
  lng: number                  // Longitude
  
  // Relations
  startSchedules: DriverSchedule[]  // Schedules starting here
  endSchedules: DriverSchedule[]    // Schedules ending here
  routesAsStart: Route[]            // Routes starting here
  routesAsEnd: Route[]              // Routes ending here
}
\`\`\`

### Route
Predefined routes between locations.

\`\`\`typescript
interface Route {
  id: string                   // Unique identifier
  vehicleType: VehicleType     // Supported vehicle type
  basePrice: Decimal           // Base fare
  estimatedTime?: number       // Duration in minutes
  distance?: Decimal           // Distance in kilometers
  isActive: boolean            // Route availability
  
  // Junction-based (KEKE)
  startJunctionId?: string
  endJunctionId?: string
  startJunction?: Junction
  endJunction?: Junction
  
  // Free-form (CAR/BUS)
  startLat?: number
  startLng?: number
  endLat?: number
  endLng?: number
  
  // Relations
  driverProfiles: DriverProfile[]
  rides: Ride[]
}
\`\`\`

### Ride
Core ride entity representing actual trips.

\`\`\`typescript
interface Ride {
  id: string                   // Unique identifier
  routeId?: string             // Associated route
  driverId?: string            // Assigned driver
  isChattered?: string         // Charter ride flag
  rideType: RideType           // Shared or private
  vehicleType: VehicleType     // Vehicle type
  status: RideStatus           // Current status
  pickupTime?: Date            // Scheduled pickup
  scheduledByDriver: boolean   // Driver-initiated
  capacity?: number            // Maximum passengers
  seatsFilled: number          // Current passengers
  
  // Location data
  requestedStartLat?: number
  requestedStartLng?: number
  requestedEndLat?: number
  requestedEndLng?: number
  startJunctionId?: string
  endJunctionId?: string
  
  // Validation codes
  scanCode: string             // QR code (unique)
  shortCode: string            // 4-digit code
  
  // Timing
  startTime?: Date             // Actual start
  endTime?: Date               // Actual end
  
  // Financial
  totalAmount: Decimal         // Total fare
  commission: Decimal          // Platform fee
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  driver?: User
  route?: Route
  passengers: RidePassenger[]
}
\`\`\`

### RidePassenger
Junction table for ride participants.

\`\`\`typescript
interface RidePassenger {
  id: string                   // Unique identifier
  rideId: string               // Associated ride
  passengerId: string          // Passenger user
  paymentMethod: PaymentMethod // How they paid
  pricePaid: Decimal           // Amount paid
  rated: boolean               // Has rated ride
  rating?: number              // Rating given (1-5)
  feedback?: string            // Text feedback
  ticketCode: string           // Passenger ticket
  scanCode: string             // Validation code (unique)
  
  // Relations
  ride: Ride
  passenger: User
}
\`\`\`

### RideRequest
Passenger requests for rides.

\`\`\`typescript
interface RideRequest {
  id: string                   // Unique identifier
  passengerId: string          // Requesting passenger
  vehicleType: VehicleType     // Requested vehicle
  isChattered?: string         // Charter request
  rideType: RideType           // Shared or private
  
  // KEKE locations (junction-based)
  startJunctionId?: string
  endJunctionId?: string
  
  // CAR/BUS locations (free-form)
  startLat?: number
  startLng?: number
  endLat?: number
  endLng?: number
  
  scheduledFor?: Date          // Future ride time
  status: RideRequestStatus    // Current status
  seatsNeeded: number          // Passenger count
  priceQuoted?: Decimal        // Estimated fare
  expiresAt?: Date             // Auto-expiry time
  acceptedRideId?: string      // Matched ride
  createdAt: Date
  
  // Relations
  passenger: User
}
\`\`\`

### DriverSchedule
Driver-posted scheduled rides (KEKE).

\`\`\`typescript
interface DriverSchedule {
  id: string                   // Unique identifier
  driverId: string             // Posting driver
  vehicleType: VehicleType     // Vehicle type
  startJunctionId: string      // Start junction
  endJunctionId: string        // End junction
  departureTime: Date          // Scheduled departure
  capacity: number             // Available seats
  seatsFilled: number          // Booked seats
  isActive: boolean            // Schedule status
  createdAt: Date
  
  // Relations
  driver: User
  startJunction: Junction
  endJunction: Junction
}
\`\`\`

### WalletTransaction
Financial transaction records.

\`\`\`typescript
interface WalletTransaction {
  id: string                   // Unique identifier
  userId: string               // Transaction owner
  amount: Decimal              // Transaction amount
  type: TransactionType        // Transaction type
  status: TransactionStatus    // Processing status
  description?: string         // Transaction description
  reference?: string           // External reference (unique)
  rideId?: string              // Associated ride
  createdAt: Date
  updatedAt: Date
  
  // Relations
  user: User
}
\`\`\`

### Notification
User notifications and messages.

\`\`\`typescript
interface Notification {
  id: string                   // Unique identifier
  userId: string               // Recipient user
  type: NotificationType       // Delivery method
  title: string                // Notification title
  body: string                 // Message content
  isRead: boolean              // Read status
  via: string                  // Delivery channel
  metadata?: Json              // Additional data
  createdAt: Date
  updatedAt: Date
  
  // Relations
  user: User
}
\`\`\`

## Relationships

### User Relationships
- **One-to-One**: User ↔ DriverProfile, User ↔ PassengerProfile
- **One-to-Many**: User → Rides (as driver), User → RideRequests, User → WalletTransactions

### Ride Relationships
- **Many-to-One**: Ride → User (driver), Ride → Route
- **One-to-Many**: Ride → RidePassengers

### Location Relationships
- **Many-to-One**: Route → Junction (start/end), DriverSchedule → Junction (start/end)

### Financial Relationships
- **Many-to-One**: WalletTransaction → User, WalletTransaction → Ride (optional)

## Data Validation

### Required Fields
- All models have required `id`, `createdAt`, and `updatedAt`
- User requires `firstName`, `lastName`, `role`
- Driver requires vehicle information
- Rides require `vehicleType`, `rideType`, `status`

### Unique Constraints
- User: `phone`, `email`
- Junction: `name`
- Ride: `scanCode`
- RidePassenger: `scanCode`, `[rideId, passengerId]`
- WalletTransaction: `reference`

### Indexes
- DriverProfile: `[isOnline, isAvailable]`, `[currentLat, currentLng]`
- Ride: `[status]`
- RideRequest: `[vehicleType, rideType, status]`
- DriverSchedule: `[startJunctionId, endJunctionId, departureTime]`

This data model supports the full ride-sharing ecosystem with proper relationships, constraints, and indexes for optimal performance.
