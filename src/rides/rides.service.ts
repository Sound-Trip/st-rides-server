import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { RideStatus, RideType, VehicleType, PaymentMethod } from "@prisma/client"
import { MatchingService } from "./matching.service"
import { NotificationsService } from "../notifications/notifications.service"
import { WalletService } from "../wallet/wallet.service"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class RidesService {
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService,
    private notificationsService: NotificationsService,
    private walletService: WalletService,
  ) {}

  async bookRide(
    passengerId: string,
    bookingData: {
      routeId: string
      pickupTime: Date
      vehicleType: VehicleType
      paymentMethod: PaymentMethod
    },
  ) {
    const route = await this.prisma.route.findUnique({
      where: { id: bookingData.routeId },
    })

    if (!route) {
      throw new NotFoundException("Route not found")
    }

    const passenger = await this.prisma.passengerProfile.findUnique({
      where: { userId: passengerId },
    })

    if (!passenger) {
      throw new NotFoundException("Passenger profile not found")
    }

    // Check wallet balance if payment method is WALLET
    if (bookingData.paymentMethod === PaymentMethod.WALLET) {
      if (passenger.walletBalance.lt(route.basePrice)) {
        throw new BadRequestException("Insufficient wallet balance")
      }
    }

    const rideType = bookingData.vehicleType === VehicleType.KEKE ? RideType.SHARED : RideType.PRIVATE

    // Try to find existing ride for shared rides
    let ride
    if (rideType === RideType.SHARED) {
      ride = await this.matchingService.findMatchingRide(bookingData.routeId, bookingData.pickupTime)
    }

    if (!ride) {
      // Find available driver
      const driver = await this.matchingService.findAvailableDriver(
        bookingData.routeId,
        bookingData.vehicleType,
        bookingData.pickupTime,
      )

      if (!driver) {
        throw new BadRequestException("No available drivers found")
      }

      // Create new ride
      ride = await this.prisma.ride.create({
        data: {
          routeId: bookingData.routeId,
          driverId: driver.userId,
          pickupTime: bookingData.pickupTime,
          rideType,
          vehicleType: bookingData.vehicleType,
          scanCode: uuidv4(),
          totalAmount: route.basePrice,
        },
      })
    }

    // Add passenger to ride
    const ridePassenger = await this.prisma.ridePassenger.create({
      data: {
        rideId: ride.id,
        passengerId,
        paymentMethod: bookingData.paymentMethod,
        pricePaid: route.basePrice,
      },
    })

    // Process payment if wallet
    if (bookingData.paymentMethod === PaymentMethod.WALLET) {
      await this.walletService.debitWallet(passengerId, route.basePrice, `Ride booking - ${ride.id}`)
    }

    // Send notifications
    await this.notificationsService.sendRideBookingNotification(ride.id, passengerId)

    return {
      ride,
      ridePassenger,
      message: "Ride booked successfully",
    }
  }

  async startRide(driverId: string, scanCode: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { scanCode },
      include: {
        passengers: {
          include: {
            passenger: true,
          },
        },
      },
    })

    if (!ride) {
      throw new NotFoundException("Ride not found")
    }

    if (ride.driverId !== driverId) {
      throw new BadRequestException("Unauthorized to start this ride")
    }

    if (ride.status !== RideStatus.SCHEDULED) {
      throw new BadRequestException("Ride cannot be started")
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: ride.id },
      data: {
        status: RideStatus.ONGOING,
        startTime: new Date(),
      },
    })

    // Notify passengers
    for (const passenger of ride.passengers) {
      await this.notificationsService.sendRideStartNotification(ride.id, passenger.passengerId)
    }

    return updatedRide
  }

  async completeRide(driverId: string, rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passengers: true,
        route: true,
      },
    })

    if (!ride) {
      throw new NotFoundException("Ride not found")
    }

    if (ride.driverId !== driverId) {
      throw new BadRequestException("Unauthorized to complete this ride")
    }

    if (ride.status !== RideStatus.ONGOING) {
      throw new BadRequestException("Ride is not ongoing")
    }

    // Calculate commission
    const commissionRate = await this.getCommissionRate()
    const commission = ride.totalAmount.mul(commissionRate).div(100)
    const driverEarnings = ride.totalAmount.sub(commission)

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: RideStatus.COMPLETED,
        endTime: new Date(),
        commission,
      },
    })

    // Credit driver wallet
    await this.walletService.creditWallet(driverId, driverEarnings, `Ride earnings - ${rideId}`)

    // Update driver stats
    await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        totalRides: { increment: 1 },
        totalEarnings: { increment: driverEarnings },
      },
    })

    // Update passenger stats
    for (const passenger of ride.passengers) {
      await this.prisma.passengerProfile.update({
        where: { userId: passenger.passengerId },
        data: {
          totalRides: { increment: 1 },
        },
      })

      // Send completion notification
      await this.notificationsService.sendRideCompletionNotification(rideId, passenger.passengerId)
    }

    return updatedRide
  }

  async cancelRide(userId: string, rideId: string, reason?: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        passengers: true,
      },
    })

    if (!ride) {
      throw new NotFoundException("Ride not found")
    }

    // Check if user is driver or passenger
    const isDriver = ride.driverId === userId
    const isPassenger = ride.passengers.some((p) => p.passengerId === userId)

    if (!isDriver && !isPassenger) {
      throw new BadRequestException("Unauthorized to cancel this ride")
    }

    if (ride.status === RideStatus.ONGOING) {
      throw new BadRequestException("Cannot cancel ongoing ride")
    }

    if (ride.status === RideStatus.COMPLETED) {
      throw new BadRequestException("Cannot cancel completed ride")
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: RideStatus.CANCELLED,
      },
    })

    // Refund passengers who paid via wallet
    for (const passenger of ride.passengers) {
      if (passenger.paymentMethod === PaymentMethod.WALLET) {
        await this.walletService.creditWallet(
          passenger.passengerId,
          passenger.pricePaid,
          `Ride cancellation refund - ${rideId}`,
        )
      }

      // Send cancellation notification
      await this.notificationsService.sendRideCancellationNotification(rideId, passenger.passengerId)
    }

    return updatedRide
  }

  async rateRide(passengerId: string, rideId: string, rating: number, feedback?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5")
    }

    const ridePassenger = await this.prisma.ridePassenger.findFirst({
      where: {
        rideId,
        passengerId,
      },
      include: {
        ride: true,
      },
    })

    if (!ridePassenger) {
      throw new NotFoundException("Ride passenger record not found")
    }

    if (ridePassenger.ride.status !== RideStatus.COMPLETED) {
      throw new BadRequestException("Can only rate completed rides")
    }

    if (ridePassenger.rated) {
      throw new BadRequestException("Ride already rated")
    }

    await this.prisma.ridePassenger.update({
      where: { id: ridePassenger.id },
      data: {
        rated: true,
        rating,
        feedback,
      },
    })

    // Award tokens for good ratings
    if (rating >= 4) {
      await this.walletService.awardTokens(passengerId, 10, "Good ride rating")
    }

    // Update driver rating
    await this.updateDriverRating(ridePassenger.ride.driverId)

    return { message: "Rating submitted successfully" }
  }

  private async updateDriverRating(driverId: string) {
    const ratings = await this.prisma.ridePassenger.findMany({
      where: {
        ride: {
          driverId,
          status: RideStatus.COMPLETED,
        },
        rated: true,
        rating: { not: null },
      },
      select: { rating: true },
    })

    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating!, 0) / ratings.length

      await this.prisma.driverProfile.update({
        where: { userId: driverId },
        data: { rating: averageRating },
      })
    }
  }

  private async getCommissionRate(): Promise<number> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: "commission_rate" },
    })

    return config ? Number.parseFloat(config.value) : 15 // Default 15%
  }

  async getPassengerRides(passengerId: string, status?: RideStatus) {
    return this.prisma.ridePassenger.findMany({
      where: {
        passengerId,
        ...(status && {
          ride: {
            status,
          },
        }),
      },
      include: {
        ride: {
          include: {
            route: true,
            driver: {
              include: {
                driverProfile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  async getDriverRides(driverId: string, status?: RideStatus) {
    return this.prisma.ride.findMany({
      where: {
        driverId,
        ...(status && { status }),
      },
      include: {
        route: true,
        passengers: {
          include: {
            passenger: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }
}
