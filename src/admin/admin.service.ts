import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import { UserRole, MaintenanceStatus } from "@prisma/client"
import type { NotificationsService } from "../notifications/notifications.service"

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalDrivers,
      totalPassengers,
      totalRides,
      completedRides,
      totalRevenue,
      pendingMaintenanceRequests,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.driverProfile.count(),
      this.prisma.passengerProfile.count(),
      this.prisma.ride.count(),
      this.prisma.ride.count({ where: { status: "COMPLETED" } }),
      this.prisma.ride.aggregate({
        where: { status: "COMPLETED" },
        _sum: { commission: true },
      }),
      this.prisma.maintenanceRequest.count({
        where: { status: MaintenanceStatus.REQUESTED },
      }),
    ])

    return {
      totalUsers,
      totalDrivers,
      totalPassengers,
      totalRides,
      completedRides,
      totalRevenue: totalRevenue._sum.commission || 0,
      pendingMaintenanceRequests,
    }
  }

  async getAllUsers(page = 1, limit = 20, role?: UserRole) {
    const skip = (page - 1) * limit

    const where = {
      ...(role && { role }),
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          passengerProfile: true,
          driverProfile: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async createDriver(driverData: {
    firstName: string
    lastName: string
    phone: string
    email?: string
    vehicleType: string
    vehicleModel: string
    plateNumber: string
    licenseNumber: string
    assignedRouteId?: string
    isCompanyVehicle?: boolean
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: driverData.phone }, { email: driverData.email }],
      },
    })

    if (existingUser) {
      throw new BadRequestException("User with this phone or email already exists")
    }

    const user = await this.prisma.user.create({
      data: {
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        phone: driverData.phone,
        email: driverData.email,
        role: UserRole.DRIVER,
        driverProfile: {
          create: {
            vehicleType: driverData.vehicleType as any,
            vehicleModel: driverData.vehicleModel,
            plateNumber: driverData.plateNumber,
            licenseNumber: driverData.licenseNumber,
            assignedRouteId: driverData.assignedRouteId,
            isCompanyVehicle: driverData.isCompanyVehicle || false,
            maintenanceDueDate: driverData.isCompanyVehicle
              ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
              : null,
          },
        },
      },
      include: {
        driverProfile: true,
      },
    })

    return user
  }

  async banUser(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    // Send notification
    await this.notificationsService.sendNotification(
      userId,
      "EMAIL",
      "Account Suspended",
      `Your account has been suspended. ${reason ? `Reason: ${reason}` : ""}`,
      "email",
      { type: "account_banned", reason },
    )

    return { message: "User banned successfully" }
  }

  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })

    // Send notification
    await this.notificationsService.sendNotification(
      userId,
      "EMAIL",
      "Account Reactivated",
      "Your account has been reactivated. You can now use the app normally.",
      "email",
      { type: "account_unbanned" },
    )

    return { message: "User unbanned successfully" }
  }

  async getAllRides(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status }),
    }

    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        include: {
          route: true,
          driver: {
            include: {
              driverProfile: true,
            },
          },
          passengers: {
            include: {
              passenger: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.ride.count({ where }),
    ])

    return {
      rides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getMaintenanceRequests(status?: MaintenanceStatus) {
    return this.prisma.maintenanceRequest.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        driver: {
          include: {
            driverProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async approveMaintenanceRequest(requestId: string, adminId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        driver: true,
      },
    })

    if (!request) {
      throw new NotFoundException("Maintenance request not found")
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: MaintenanceStatus.APPROVED,
        approvedDate: new Date(),
        approvedBy: adminId,
      },
    })

    // Send notification to driver
    await this.notificationsService.sendNotification(
      request.driverId,
      "PUSH",
      "Maintenance Request Approved",
      "Your maintenance request has been approved. Please complete it within 7 days.",
      "push",
      { type: "maintenance_approved", requestId },
    )

    return updatedRequest
  }

  async setCommissionRate(rate: number) {
    if (rate < 0 || rate > 50) {
      throw new BadRequestException("Commission rate must be between 0 and 50 percent")
    }

    await this.prisma.systemConfig.upsert({
      where: { key: "commission_rate" },
      update: { value: rate.toString() },
      create: {
        key: "commission_rate",
        value: rate.toString(),
        description: "System-wide commission rate percentage",
      },
    })

    return { message: "Commission rate updated successfully", rate }
  }

  async getSystemConfig() {
    const configs = await this.prisma.systemConfig.findMany()

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value
      return acc
    }, {})

    return configMap
  }

  async getWalletTransactions(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit

    const where = {
      ...(userId && { userId }),
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.walletTransaction.count({ where }),
    ])

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
}
