import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { PrismaService } from "../prisma/prisma.service"
import type { NotificationsService } from "../notifications/notifications.service"

@Injectable()
export class RideMatcherService {
  private readonly logger = new Logger(RideMatcherService.name)

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Automatic ride matching checker that runs every 2 minutes
   *
   * Workflow:
   * 1. Fetch all PENDING ride requests
   * 2. For each request, try to match against active driver schedules
   *    - Match criteria: same start/end junction, scheduled time within 15 mins before to 5 mins after
   * 3. If match found: auto-add request to that schedule (create ride if needed)
   * 4. If no match after 15 mins: group similar pending requests and notify drivers
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async matchRidesToSchedules() {
    try {
      this.logger.debug("Starting automatic ride matching...")
      const now = new Date()

      // Step 1: Fetch all PENDING ride requests
      const pendingRequests = await this.prisma.rideRequest.findMany({
        where: {
          status: "PENDING",
          vehicleType: "KEKE",
          rideType: "SHARED",
        },
        include: {
          passenger: true,
        },
      })

      this.logger.debug(`Found ${pendingRequests.length} pending requests`)

      for (const request of pendingRequests) {
        // Skip if request has already been accepted
        if (request.acceptedRideId) continue

        // Step 2: Try to match against driver schedules
        const matchedSchedule = await this.findMatchingSchedule(request, now)

        if (matchedSchedule) {
          // Match found: auto-add to schedule
          await this.addRequestToSchedule(request, matchedSchedule)
          this.logger.log(`✅ Request ${request.id} matched to schedule ${matchedSchedule.id}`)
        } else {
          // No match: check if 15 mins have elapsed
          const elapsedMinutes = (now.getTime() - request.createdAt.getTime()) / (1000 * 60)

          if (elapsedMinutes >= 15) {
            // Step 4: Group similar requests and notify drivers
            await this.groupAndNotifyDrivers(request)
          }
        }
      }

      this.logger.debug("Ride matching cycle completed")
    } catch (error) {
      this.logger.error("Error in ride matching:", error)
    }
  }

  /**
   * Find a matching driver schedule for a ride request
   * Criteria: same start/end junction, departure time within 15 mins before to 5 mins after request scheduledFor
   */
  private async findMatchingSchedule(request: any, now: Date) {
    // If request has no scheduled time, use current time
    const requestTime = request.scheduledFor || now
    const windowStart = new Date(requestTime.getTime() - 15 * 60 * 1000) // 15 mins before
    const windowEnd = new Date(requestTime.getTime() + 5 * 60 * 1000) // 5 mins after

    const schedule = await this.prisma.driverSchedule.findFirst({
      where: {
        startJunctionId: request.startJunctionId,
        endJunctionId: request.endJunctionId,
        vehicleType: "KEKE",
        isActive: true,
        departureTime: {
          gte: windowStart,
          lte: windowEnd,
        },
        // Only match if schedule has available seats
        seatsFilled: {
          lt: 4, // KEKE capacity is 4
        },
      },
      orderBy: {
        departureTime: "asc",
      },
    })

    return schedule
  }

  /**
   * Add a matched request to a driver schedule by creating/updating a ride
   */
  private async addRequestToSchedule(request: any, schedule: any) {
    return this.prisma.$transaction(async (tx) => {
      // Find or create ride for this schedule
      let ride = await tx.ride.findFirst({
        where: {
          driverId: schedule.driverId,
          startJunctionId: schedule.startJunctionId,
          endJunctionId: schedule.endJunctionId,
          pickupTime: schedule.departureTime,
          status: { in: ["PENDING", "SCHEDULED"] },
        },
      })

      if (!ride) {
        // Create new ride
        ride = await tx.ride.create({
          data: {
            driverId: schedule.driverId,
            vehicleType: "KEKE",
            rideType: "SHARED",
            status: "SCHEDULED",
            scanCode: this.generateScanCode(),
            shortCode: this.generateShortCode(),
            pickupTime: schedule.departureTime,
            capacity: 4,
            seatsFilled: 0,
            startJunctionId: schedule.startJunctionId,
            endJunctionId: schedule.endJunctionId,
            scheduledByDriver: true,
          },
        })
      }

      // Check if passenger already in ride
      const alreadyAdded = await tx.ridePassenger.findFirst({
        where: {
          rideId: ride.id,
          passengerId: request.passengerId,
        },
      })

      if (!alreadyAdded && ride.seatsFilled < 4) {
        // Add passenger to ride
        await tx.ridePassenger.create({
          data: {
            rideId: ride.id,
            passengerId: request.passengerId,
            paymentMethod: "CASH",
            pricePaid: request.priceQuoted || 0,
            ticketCode: String(Math.floor(1000 + Math.random() * 9000)),
            scanCode: this.generateScanCode(),
          },
        })

        // Update ride seat count
        await tx.ride.update({
          where: { id: ride.id },
          data: { seatsFilled: { increment: 1 } },
        })

        // Update schedule seat count
        await tx.driverSchedule.update({
          where: { id: schedule.id },
          data: { seatsFilled: { increment: 1 } },
        })
      }

      // Update request status
      await tx.rideRequest.update({
        where: { id: request.id },
        data: {
          status: "ACCEPTED",
          acceptedRideId: ride.id,
        },
      })

      await this.notificationsService.sendNotification(
        request.passengerId,
        "Ride Matched!",
        `Your ride has been matched to a driver schedule. Departure at ${schedule.departureTime.toLocaleTimeString()}`,
        {
          rideId: ride.id,
          scheduleId: schedule.id,
          type: "RIDE_MATCHED",
        },
      )
    })
  }

  /**
   * Group similar pending requests and notify all drivers
   * Groups requests with same start/end junction and scheduledFor within 10-min window
   */
  private async groupAndNotifyDrivers(baseRequest: any) {
    const now = new Date()

    // Find similar pending requests (same start/end junction, within 10-min window)
    const baseTime = baseRequest.scheduledFor || now
    const windowStart = new Date(baseTime.getTime() - 5 * 60 * 1000) // 5 mins before
    const windowEnd = new Date(baseTime.getTime() + 5 * 60 * 1000) // 5 mins after

    const similarRequests = await this.prisma.rideRequest.findMany({
      where: {
        status: "PENDING",
        startJunctionId: baseRequest.startJunctionId,
        endJunctionId: baseRequest.endJunctionId,
        vehicleType: "KEKE",
        rideType: "SHARED",
        scheduledFor: {
          gte: windowStart,
          lte: windowEnd,
        },
        acceptedRideId: null, // Not yet accepted
      },
    })

    if (similarRequests.length === 0) return

    this.logger.log(`📢 Grouping ${similarRequests.length} similar requests and notifying drivers`)

    // Create a grouped ride request notification
    const groupedRequestIds = similarRequests.map((r) => r.id)

    // Get all online drivers (for now, all drivers - will filter by location later)
    const drivers = await this.prisma.driverProfile.findMany({
      where: {
        vehicleType: "KEKE",
        isOnline: true,
        isAvailable: true,
      },
      include: {
        user: true,
      },
    })

    this.logger.log(`📢 Notifying ${drivers.length} drivers about grouped requests`)

    for (const driver of drivers) {
      await this.notificationsService.sendNotification(
        driver.userId,
        `${similarRequests.length} Passengers Waiting`,
        `${similarRequests.length} passengers are waiting for a ride from ${baseRequest.startJunctionId} to ${baseRequest.endJunctionId}. Tap to accept.`,
        {
          requestIds: groupedRequestIds,
          startJunctionId: baseRequest.startJunctionId,
          endJunctionId: baseRequest.endJunctionId,
          scheduledFor: baseTime.toISOString(),
          count: similarRequests.length,
          type: "GROUPED_REQUESTS",
        },
      )
    }

    // Mark requests as MATCHING to avoid duplicate notifications
    await this.prisma.rideRequest.updateMany({
      where: {
        id: { in: groupedRequestIds },
      },
      data: {
        status: "MATCHING",
      },
    })
  }

  private generateShortCode() {
    return (1000 + Math.floor(Math.random() * 9000)).toString()
  }

  private generateScanCode() {
    return Math.floor(Math.random() * 10000).toString()
  }
}
