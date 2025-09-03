-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('PASSENGER', 'DRIVER', 'ADMIN', 'SUPPORT_AGENT');

-- CreateEnum
CREATE TYPE "public"."VehicleType" AS ENUM ('KEKE', 'CAR', 'BUS');

-- CreateEnum
CREATE TYPE "public"."RideStatus" AS ENUM ('PENDING', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RideType" AS ENUM ('SHARED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('WALLET', 'CASH', 'TOKEN');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'COMMISSION', 'CASHOUT', 'TOKEN_REWARD');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('REQUESTED', 'APPROVED', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('PUSH', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "public"."RideRequestStatus" AS ENUM ('PENDING', 'MATCHING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "password_hash" TEXT,
    "role" "public"."UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_profiles" (
    "user_id" TEXT NOT NULL,
    "vehicle_type" "public"."VehicleType" NOT NULL,
    "vehicle_model" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "busVariantId" TEXT,
    "license_number" TEXT NOT NULL,
    "profile_photo_url" TEXT,
    "assigned_route_id" TEXT,
    "is_company_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "last_maintenance_date" TIMESTAMP(3),
    "maintenance_due_date" TIMESTAMP(3),
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "wallet_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "total_rides" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "current_lat" DOUBLE PRECISION,
    "current_lng" DOUBLE PRECISION,
    "last_ping_at" TIMESTAMP(3),

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."passenger_profiles" (
    "user_id" TEXT NOT NULL,
    "profile_photo_url" TEXT,
    "wallet_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "earned_tokens" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "total_rides" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."bus_variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "baseFare" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "bus_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."junctions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "junctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."routes" (
    "id" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "basePrice" DECIMAL(8,2) NOT NULL,
    "estimatedTime" INTEGER,
    "distance" DECIMAL(8,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startJunctionId" TEXT,
    "endJunctionId" TEXT,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rides" (
    "id" TEXT NOT NULL,
    "routeId" TEXT,
    "driverId" TEXT,
    "rideType" "public"."RideType" NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "status" "public"."RideStatus" NOT NULL DEFAULT 'PENDING',
    "pickupTime" TIMESTAMP(3),
    "scheduledByDriver" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "seats_filled" INTEGER NOT NULL DEFAULT 0,
    "requestedStartLat" DOUBLE PRECISION,
    "requestedStartLng" DOUBLE PRECISION,
    "requestedEndLat" DOUBLE PRECISION,
    "requestedEndLng" DOUBLE PRECISION,
    "scanCode" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "totalAmount" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "commission" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ride_passengers" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "pricePaid" DECIMAL(8,2) NOT NULL,
    "rated" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "feedback" TEXT,

    CONSTRAINT "ride_passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ride_requests" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "rideType" "public"."RideType" NOT NULL,
    "startJunctionId" TEXT,
    "endJunctionId" TEXT,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,
    "scheduledFor" TIMESTAMP(3),
    "status" "public"."RideRequestStatus" NOT NULL DEFAULT 'PENDING',
    "seatsNeeded" INTEGER NOT NULL DEFAULT 1,
    "priceQuoted" DECIMAL(10,2),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedRideId" TEXT,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."driver_schedules" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleType" "public"."VehicleType" NOT NULL,
    "startJunctionId" TEXT NOT NULL,
    "endJunctionId" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "seatsFilled" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "reference" TEXT,
    "ride_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_requests" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "requested_date" TIMESTAMP(3) NOT NULL,
    "approved_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'REQUESTED',
    "description" TEXT,
    "cost" DECIMAL(8,2),
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "via" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."otp_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "permissions" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "driver_profiles_is_online_is_available_idx" ON "public"."driver_profiles"("is_online", "is_available");

-- CreateIndex
CREATE INDEX "driver_profiles_current_lat_current_lng_idx" ON "public"."driver_profiles"("current_lat", "current_lng");

-- CreateIndex
CREATE UNIQUE INDEX "junctions_name_key" ON "public"."junctions"("name");

-- CreateIndex
CREATE INDEX "routes_vehicleType_idx" ON "public"."routes"("vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "rides_scanCode_key" ON "public"."rides"("scanCode");

-- CreateIndex
CREATE INDEX "rides_status_idx" ON "public"."rides"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ride_passengers_rideId_passengerId_key" ON "public"."ride_passengers"("rideId", "passengerId");

-- CreateIndex
CREATE INDEX "ride_requests_vehicleType_rideType_status_idx" ON "public"."ride_requests"("vehicleType", "rideType", "status");

-- CreateIndex
CREATE INDEX "driver_schedules_startJunctionId_endJunctionId_departureTim_idx" ON "public"."driver_schedules"("startJunctionId", "endJunctionId", "departureTime");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_reference_key" ON "public"."wallet_transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "public"."admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "public"."system_config"("key");

-- AddForeignKey
ALTER TABLE "public"."driver_profiles" ADD CONSTRAINT "driver_profiles_busVariantId_fkey" FOREIGN KEY ("busVariantId") REFERENCES "public"."bus_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_profiles" ADD CONSTRAINT "driver_profiles_assigned_route_id_fkey" FOREIGN KEY ("assigned_route_id") REFERENCES "public"."routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."passenger_profiles" ADD CONSTRAINT "passenger_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_startJunctionId_fkey" FOREIGN KEY ("startJunctionId") REFERENCES "public"."junctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_endJunctionId_fkey" FOREIGN KEY ("endJunctionId") REFERENCES "public"."junctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rides" ADD CONSTRAINT "rides_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_passengers" ADD CONSTRAINT "ride_passengers_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "public"."rides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_passengers" ADD CONSTRAINT "ride_passengers_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ride_requests" ADD CONSTRAINT "ride_requests_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_schedules" ADD CONSTRAINT "driver_schedules_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_schedules" ADD CONSTRAINT "driver_schedules_startJunctionId_fkey" FOREIGN KEY ("startJunctionId") REFERENCES "public"."junctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."driver_schedules" ADD CONSTRAINT "driver_schedules_endJunctionId_fkey" FOREIGN KEY ("endJunctionId") REFERENCES "public"."junctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_requests" ADD CONSTRAINT "maintenance_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
