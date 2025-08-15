import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { type VehicleType, RideStatus, RideType } from "@prisma/client"

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) { }

  async findMatchingRide(routeId: string, pickupTime: Date) {
    // Look for existing shared rides within 30 minutes of pickup time
    const timeWindow = 30 * 60 * 1000 // 30 minutes in milliseconds
    const startTime = new Date(pickupTime.getTime() - timeWindow)
    const endTime = new Date(pickupTime.getTime() + timeWindow)

    const existingRide = await this.prisma.ride.findFirst({
      where: {
        routeId,
        rideType: RideType.SHARED,
        status: RideStatus.SCHEDULED,
        pickupTime: {
          gte: startTime,
          lte: endTime,
        },
      },
      include: {
        passengers: true,
      },
    });

    if (existingRide && existingRide.passengers.length < 3) {
      return existingRide;
    }
    return null;
  }

  async findAvailableDriver(routeId: string, vehicleType: VehicleType, pickupTime: Date) {
    // Find drivers with matching vehicle type and assigned route
    const availableDrivers = await this.prisma.driverProfile.findMany({
      where: {
        vehicleType,
        assignedRouteId: routeId,
        isBlocked: false,
        user: {
          isActive: true,
          ridesAsDriver: {
            none: {
              status: {
                in: [RideStatus.SCHEDULED, RideStatus.ONGOING],
              },
              pickupTime: {
                gte: new Date(pickupTime.getTime() - 2 * 60 * 60 * 1000),
                lte: new Date(pickupTime.getTime() + 2 * 60 * 60 * 1000),
              },
            },
          },
        },
      },
      include: {
        user: true,
      },
      orderBy: [{ rating: "desc" }, { totalRides: "desc" }],
    })

    // Return the best available driver
    return availableDrivers[0] || null
  }

  async getDriverRecommendations(driverId: string) {
    // Get scheduled rides that match driver's route and vehicle type
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
    })

    if (!driver || !driver.assignedRouteId) {
      return []
    }

    const recommendations = await this.prisma.ride.findMany({
      where: {
        routeId: driver.assignedRouteId,
        vehicleType: driver.vehicleType,
        status: RideStatus.SCHEDULED,
        // driverId: null // Unassigned rides WAS "driverId: NULL"
        pickupTime: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next 24 hours
        },
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
        pickupTime: "asc",
      },
      take: 10,
    })

    return recommendations
  }

  async autoAssignDriver(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        route: true,
      },
    })

    if (!ride || ride.driverId) {
      return null
    }

    const driver = await this.findAvailableDriver(ride.routeId, ride.vehicleType, ride.pickupTime)

    if (driver) {
      const updatedRide = await this.prisma.ride.update({
        where: { id: rideId },
        data: {
          driverId: driver.userId,
        },
      })

      return updatedRide
    }

    return null
  }
}
