import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as QR from 'qrcode';

function generateShortCode() {
  return (1000 + Math.floor(Math.random() * 9000)).toString();
}
function generateScanCode() {
  return randomInt(4).toString();
}

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) { }

  async getRideDetails(rideId: string) {
    return this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: { select: { firstName: true, lastName: true, phone: true } },
        route: true,
        passengers: {
          include: { passenger: { select: { firstName: true, lastName: true } } },
        },
      },
    });
  }



  async acceptRequestAsDriver_old(driverId: string, requestId: string) {
    return this.prisma.$transaction(async tx => {
      const req = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!req || req.status !== 'PENDING') throw new Error('Request not available');

      // create or reuse a Ride for KEKE shared to aggregate multiple passengers
      const createRideData: any = {
        driverId,
        vehicleType: req.vehicleType,
        rideType: req.rideType,
        status: 'SCHEDULED',
        scanCode: generateScanCode(),
        shortCode: generateShortCode(),
        pickupTime: req.scheduledFor ?? new Date(),
        totalAmount: req.priceQuoted ?? 0,
        commission: 0,
        routeId: null,
        capacity: req.vehicleType === 'KEKE' ? 4 : (req.vehicleType === 'BUS' ? 14 : 1),
        seatsFilled: 0,
        requestedStartLat: req.startLat,
        requestedStartLng: req.startLng,
        requestedEndLat: req.endLat,
        requestedEndLng: req.endLng,
      };

      // attach route for KEKE if known
      // if (req.vehicleType === 'KEKE') {
      //   const route = await tx.route.findFirst({
      //     where: {
      //       vehicleType: 'KEKE',
      //       startJunctionId: req.startJunctionId!,
      //       endJunctionId: req.endJunctionId!,
      //       isActive: true,
      //     },
      //   });
      //   if (route) createRideData.routeId = route.id;
      // }

      const ride = await tx.ride.create({ data: createRideData });

      await tx.rideRequest.update({
        where: { id: req.id },
        data: { status: 'ACCEPTED', acceptedRideId: ride.id },
      });

      // notify passenger
      // this.events.emit('ride.accepted', { rideId: ride.id, passengerId: req.passengerId })

      return ride;
    });
  }

  /** Accepts a passenger ride request as a driver and creates the corresponding ride.
 *
 * Source of input values:
 * - `requestId` is obtained from the passenger request endpoint: **POST /ride-requests**
 *   or **GET /ride-requests/:id**
 * - `driverId` is obtained from the authenticated driver context
 *   (e.g., after login via **POST /auth/login** or driver profile endpoint).
 *
 * Workflow:
 * 1. Validates that the ride request exists and is in `PENDING` status.
 * 2. Determines if the request is a KEKE shared ride (capacity-limited to 4).
 * 3. Extracts departure time, start, and end junction IDs from the request.
 * 4. If not a chattered request:
 *    - Creates a driver schedule entry linked to the driver.
 * 5. Creates a ride with the following details:
 *    - Vehicle and ride type
 *    - Capacity (KEKE=4, BUS=14, otherwise=1)
 *    - Pickup time and requested route information
 *    - Pricing and scan/short codes
 * 6. Handles KEKE shared rides:
 *    - Fetches other `PENDING` requests with the same route (junction IDs).
 *    - Sorts them by proximity to the base request’s scheduled time.
 *    - Aggregates them into the same ride until capacity is reached.
 * 7. Iterates over aggregated requests:
 *    - Creates ride–passenger records with payment, ticket code, and scan code.
 *    - Updates ride requests to `ACCEPTED` and links them to the created ride.
 *    - Tracks accepted request IDs and ride passengers.
 * 8. Updates ride and driver schedule seat counts.
 * 9. Marks ride as `SCHEDULED` if capacity is fully filled.
 *
 * Returns:
 * - `ride`: the created ride record
 * - `driverSchedule`: created schedule record (null if chattered ride)
 * - `acceptedRequestIds`: array of request IDs successfully accepted
 * - `ridePassengers`: array of created ride–passenger records
 *
 * Errors:
 * - `Error("Request not available")` if the request does not exist or is not `PENDING`.
 * - `console.warn` is logged if KEKE shared request is missing junction IDs
 *   (ride aggregation skipped).
 *
 * @param driverId  The unique identifier of the driver accepting the request.
 * @param requestId The unique identifier of the passenger’s ride request being accepted.
 * @returns Ride creation result with linked schedule, passengers, and accepted request IDs.
 */
  async acceptRequestAsDriver(driverId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!req || req.status !== "PENDING") throw new Error("Request not available");

      const isKekeShared = req.vehicleType === "KEKE" && req.rideType === "SHARED";
      const KEKE_CAPACITY = 4;

      const departureTime = req.scheduledFor ?? new Date();
      const startJunctionId = req.startJunctionId;
      const endJunctionId = req.endJunctionId;

      if (isKekeShared && (!startJunctionId || !endJunctionId)) {
        console.warn("KEKE shared request missing junction ids; aggregation will be skipped.");
      }

      // 👉 Skip creating a driver schedule if chattered
      let driverSchedule: any = null;
      if (!req.isChattered) {
        driverSchedule = await tx.driverSchedule.create({
          data: {
            driverId,
            vehicleType: req.vehicleType,
            startJunctionId: startJunctionId ?? "",
            endJunctionId: endJunctionId ?? "",
            departureTime,
            capacity: KEKE_CAPACITY,
            seatsFilled: 0,
            isActive: true,
          },
        });
      }

      const createRideData: any = {
        driverId,
        vehicleType: req.vehicleType,
        rideType: req.rideType,
        status: "SCHEDULED",
        scanCode: generateScanCode(),
        shortCode: generateShortCode(),
        pickupTime: departureTime,
        totalAmount: req.priceQuoted ?? 0,
        commission: 0,
        routeId: null,
        capacity: req.vehicleType === "KEKE" ? KEKE_CAPACITY : (req.vehicleType === "BUS" ? 14 : 1),
        seatsFilled: 0,
        startJunctionId: startJunctionId ?? null,
        endJunctionId: endJunctionId ?? null,
        requestedStartLat: req.startLat ?? null,
        requestedStartLng: req.startLng ?? null,
        requestedEndLat: req.endLat ?? null,
        requestedEndLng: req.endLng ?? null,
        scheduledByDriver: true,
      };

      const ride = await tx.ride.create({ data: createRideData });

      const acceptedRequests: string[] = [];
      const createdRidePassengers: any[] = [];
      const pendingBaseRequests: any[] = [req];

      if (isKekeShared && !req.isChattered && startJunctionId && endJunctionId) {
        const otherRequests = await tx.rideRequest.findMany({
          where: {
            status: "PENDING",
            startJunctionId,
            endJunctionId,
            id: { not: requestId },
          },
        });

        const baseTime = req.scheduledFor ? req.scheduledFor.getTime() : Date.now();
        otherRequests.sort((a, b) => {
          const at = a.scheduledFor ? a.scheduledFor.getTime() : baseTime;
          const bt = b.scheduledFor ? b.scheduledFor.getTime() : baseTime;
          return Math.abs(at - baseTime) - Math.abs(bt - baseTime);
        });

        pendingBaseRequests.push(...otherRequests);
      }

      const capacity = createRideData.capacity ?? KEKE_CAPACITY;
      let seatsTaken = 0;

      for (const r of pendingBaseRequests) {
        if (seatsTaken >= capacity) break;

        const passengerAlreadyAdded = await tx.ridePassenger.findFirst({
          where: { rideId: ride.id, passengerId: r.passengerId },
        });
        if (passengerAlreadyAdded) continue;

        const pricePaid = r.priceQuoted ?? createRideData.totalAmount ?? 0;

        const rp = await tx.ridePassenger.create({
          data: {
            rideId: ride.id,
            passengerId: r.passengerId,
            paymentMethod: "CASH",
            pricePaid,
            ticketCode: String(Math.floor(1000 + Math.random() * 9000)),
            scanCode: generateScanCode(),
          },
        });

        createdRidePassengers.push(rp);

        await tx.rideRequest.update({
          where: { id: r.id },
          data: {
            status: "ACCEPTED",
            acceptedRideId: ride.id,
          },
        });

        acceptedRequests.push(r.id);
        seatsTaken += 1;
      }

      if (seatsTaken > 0) {
        await tx.ride.update({
          where: { id: ride.id },
          data: { seatsFilled: { increment: seatsTaken } },
        });

        if (driverSchedule) {
          await tx.driverSchedule.update({
            where: { id: driverSchedule.id },
            data: { seatsFilled: { increment: seatsTaken } },
          });
        }
      }

      if ((ride.capacity ?? capacity) <= seatsTaken) {
        await tx.ride.update({
          where: { id: ride.id },
          data: { status: "SCHEDULED" },
        });
      }

      return {
        ride,
        driverSchedule,
        acceptedRequestIds: acceptedRequests,
        ridePassengers: createdRidePassengers,
      };
    });
  }

  async startRide(driverId: string, rideId: string, code: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) throw new Error('Ride not found');
    if (ride.shortCode !== code) throw new Error('Invalid code');

    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'ONGOING', startTime: new Date() },
    });
  }

  async completeRide(rideId: string) {
    const ride = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', endTime: new Date() },
    });
    // compute commission and payouts here
    const commissionRate = 0.1;
    const commission = ride.totalAmount.toNumber() * commissionRate;
    const driverEarnings = ride.totalAmount.toNumber() - commission;

    await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        commission,
      },
    });

    // Update driver profile totals
    ride.driverId && await this.prisma.driverProfile.update({
      where: { userId: ride.driverId },
      data: {
        totalEarnings: { increment: driverEarnings },
        walletBalance: { increment: driverEarnings },
        totalRides: { increment: 1 },
      },
    });
    return ride;
  }

  async getCode(rideId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    const payload = JSON.stringify({ rideId, shortCode: ride.shortCode });
    const dataUrl = await QR.toDataURL(payload);
    return { shortCode: ride.shortCode, qrDataUrl: dataUrl };
  }

  async cancelRide(driverId: string, rideId: string, reason: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.driverId !== driverId) throw new ForbiddenException('Not your ride');
    if (ride.status !== 'PENDING' && ride.status !== 'SCHEDULED') {
      throw new BadRequestException('Ride cannot be cancelled at this stage');
    }

    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED' },
    });
    // TODO: emit `ride.cancelled` event and notify passengers
  }


  /** Confirms and books a seat for a passenger on a scheduled ride.
   * 
   *
   * Source of input values:
   * - `scheduleId` is obtained from the passenger endpoint: **GET /passengers/schedules**
   * - `passengerId` is obtained from the authenticated passenger context 
   *   (e.g., after login via **POST /auth/login** or user profile endpoint).
   *
   * Workflow:
   * 1. Validates that the driver’s schedule exists.
   * 2. Finds or creates a ride linked to the given schedule.
   *    - If no ride exists, a new one is created with details from the schedule.
   * 3. Validates seat availability against ride capacity.
   * 4. Ensures the passenger has not already booked the ride.
   * 5. Generates a passenger-specific ticket code and scan code.
   * 6. Executes a transactional update:
   *    - Creates a ride–passenger record with payment and ticket details.
   *    - Increments the ride’s filled seats.
   *    - Increments the schedule’s filled seats.
   *
   * Returns:
   * - `success`: boolean flag
   * - `rideId`: identifier of the confirmed ride
   * - `passengerTicket`: object containing:
   *    - `ticketCode`: passenger-specific numeric code
   *    - `scanCode`: passenger-specific QR/scan code
   *
   * Errors:
   * - `NotFoundException` if the schedule does not exist.
   * - `BadRequestException` if no seats are left.
   * - `BadRequestException` if the passenger already confirmed the ride.
   *
   * @param passengerId The unique identifier of the passenger confirming the ride.
   * @param scheduleId  The unique identifier of the driver’s schedule being confirmed.
   * @returns Ride confirmation result with passenger’s ticket details.
   */
  async confirmRide(passengerId: string, scheduleId: string) {
    const schedule = await this.prisma.driverSchedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule) throw new NotFoundException("Schedule not found");

    // find or create ride linked to this schedule
    let ride = await this.prisma.ride.findFirst({
      where: { scheduledByDriver: true, routeId: schedule.id },
      include: { passengers: true },
    });

    if (!ride) {
      ride = await this.prisma.ride.create({
        data: {
          driverId: schedule.driverId,
          vehicleType: schedule.vehicleType,
          rideType: "SHARED",
          capacity: schedule.capacity,
          seatsFilled: 0,
          scanCode: "null",
          shortCode: "null",
          scheduledByDriver: true,
          pickupTime: schedule.departureTime,
          startJunctionId: schedule.startJunctionId,
          endJunctionId: schedule.endJunctionId,
        },
        include: { passengers: true },
      });
    }

    // seat validation
    if (ride.seatsFilled >= (ride.capacity ?? 4)) {
      throw new BadRequestException("No seats left");
    }

    // prevent double booking
    const already = ride.passengers.find((p) => p.passengerId === passengerId);
    if (already) throw new BadRequestException("Already confirmed");

    // generate passenger-specific ticket code
    const ticketCode = String(Math.floor(1000 + Math.random() * 9000)); // 4 digit
    const scanCode = generateScanCode();

    const result = await this.prisma.$transaction([
      this.prisma.ridePassenger.create({
        data: {
          rideId: ride.id,
          passengerId,
          paymentMethod: "CASH",
          pricePaid: ride.totalAmount,
          ticketCode,   // passenger-specific code
          scanCode,     // passenger-specific QR code
        },
      }),
      this.prisma.ride.update({
        where: { id: ride.id },
        data: { seatsFilled: { increment: 1 } },
      }),
      this.prisma.driverSchedule.update({
        where: { id: scheduleId },
        data: { seatsFilled: { increment: 1 } },
      }),
    ]);

    return {
      success: true,
      rideId: ride.id,
      passengerTicket: {
        ticketCode,
        scanCode,
      },
    };
  }
}