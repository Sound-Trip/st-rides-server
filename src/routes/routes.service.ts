import { Injectable, NotFoundException } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import type { VehicleType } from "@prisma/client"

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async createRoute(routeData: {
    startLocation: string
    endLocation: string
    type: VehicleType
    basePrice: number
    distance?: number
    estimatedTime?: number
  }) {
    return this.prisma.route.create({
      data: {
        startLocation: routeData.startLocation,
        endLocation: routeData.endLocation,
        type: routeData.type,
        basePrice: routeData.basePrice,
        distance: routeData.distance,
        estimatedTime: routeData.estimatedTime,
      },
    })
  }

  async getAllRoutes(vehicleType?: VehicleType) {
    return this.prisma.route.findMany({
      where: {
        isActive: true,
        ...(vehicleType && { type: vehicleType }),
      },
      orderBy: [{ startLocation: "asc" }, { endLocation: "asc" }],
    })
  }

  async getRouteById(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    })

    if (!route) {
      throw new NotFoundException("Route not found")
    }

    return route
  }

  async updateRoute(
    id: string,
    updateData: {
      startLocation?: string
      endLocation?: string
      basePrice?: number
      distance?: number
      estimatedTime?: number
      isActive?: boolean
    },
  ) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    })

    if (!route) {
      throw new NotFoundException("Route not found")
    }

    return this.prisma.route.update({
      where: { id },
      data: updateData,
    })
  }

  async deleteRoute(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    })

    if (!route) {
      throw new NotFoundException("Route not found")
    }

    // Soft delete by setting isActive to false
    return this.prisma.route.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async getPopularRoutes(limit = 10) {
    return this.prisma.route.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            rides: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        },
      },
      orderBy: {
        rides: {
          _count: "desc",
        },
      },
      take: limit,
    })
  }
}
