import { Injectable } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { PrismaService } from "../prisma/prisma.service"
import type { NotificationsService } from "../notifications/notifications.service"
import type { WalletService } from "../wallet/wallet.service"
import { MaintenanceStatus } from "@prisma/client"

@Injectable()
export class SchedulerService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private walletService: WalletService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkMaintenanceDue() {
    console.log("Checking for maintenance due...")

    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const driversWithMaintenanceDue = await this.prisma.driverProfile.findMany({
      where: {
        isCompanyVehicle: true,
        maintenanceDueDate: {
          lte: threeDaysFromNow,
        },
        user: {
          isActive: true,
        },
      },
      include: {
        user: true,
      },
    })

    for (const driver of driversWithMaintenanceDue) {
      await this.notificationsService.sendMaintenanceReminderNotification(driver.userId, driver.maintenanceDueDate)
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueMaintenance() {
    console.log("Checking for overdue maintenance...")

    const today = new Date()

    // Block drivers with overdue maintenance
    await this.prisma.driverProfile.updateMany({
      where: {
        isCompanyVehicle: true,
        maintenanceDueDate: {
          lt: today,
        },
        isBlocked: false,
      },
      data: {
        isBlocked: true,
      },
    })

    // Update maintenance requests to overdue
    await this.prisma.maintenanceRequest.updateMany({
      where: {
        status: MaintenanceStatus.APPROVED,
        requestedDate: {
          lt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      },
      data: {
        status: MaintenanceStatus.OVERDUE,
      },
    })
  }

  @Cron(CronExpression.EVERY_SUNDAY_AT_NOON)
  async sendWeeklyEarningsSummary() {
    console.log("Sending weekly earnings summary...")

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const drivers = await this.prisma.driverProfile.findMany({
      where: {
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          include: {
            walletTransactions: {
              where: {
                createdAt: {
                  gte: oneWeekAgo,
                },
                type: "CREDIT",
              },
            },
          },
        },
      },
    })

    for (const driver of drivers) {
      const weeklyEarnings = driver.user.walletTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0,
      )

      if (weeklyEarnings > 0) {
        await this.notificationsService.sendNotification(
          driver.userId,
          "EMAIL",
          "Weekly Earnings Summary",
          `Your total earnings this week: ₦${weeklyEarnings.toFixed(2)}`,
          "email",
          { weeklyEarnings, type: "weekly_summary" },
        )
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async awardTokensForGoodRatings() {
    console.log("Awarding tokens for good ratings...")

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find passengers who gave 4+ star ratings yesterday
    const goodRatings = await this.prisma.ridePassenger.findMany({
      where: {
        rating: {
          gte: 4,
        },
        updatedAt: {
          gte: yesterday,
          lt: today,
        },
      },
      include: {
        passenger: true,
      },
    })

    for (const rating of goodRatings) {
      await this.walletService.awardTokens(rating.passengerId, 5, `Token reward for ${rating.rating}-star rating`)
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkInactiveDrivers() {
    console.log("Checking for inactive drivers...")

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Find drivers who haven't completed a ride in 30 days
    const inactiveDrivers = await this.prisma.driverProfile.findMany({
      where: {
        user: {
          isActive: true,
          ridesAsDriver: {
            none: {
              status: "COMPLETED",
              endTime: {
                gte: thirtyDaysAgo,
              },
            },
          },
        },
      },
    })

    // Send warning notifications
    for (const driver of inactiveDrivers) {
      await this.notificationsService.sendNotification(
        driver.userId,
        "PUSH",
        "Account Inactive Warning",
        "Your account has been inactive for 30 days. Please complete a ride to avoid suspension.",
        "push",
        { type: "inactivity_warning" },
      )
    }
  }

  @Cron("0 */6 * * *") // Every 6 hours
  async processAutomaticCashouts() {
    console.log("Processing automatic cashouts...")

    // Find drivers with balance > minimum cashout amount
    const minCashoutAmount = 1000 // ₦1000

    const driversForCashout = await this.prisma.driverProfile.findMany({
      where: {
        walletBalance: {
          gte: minCashoutAmount,
        },
        user: {
          isActive: true,
        },
      },
    })

    for (const driver of driversForCashout) {
      try {
        await this.walletService.requestCashout(driver.userId, driver.walletBalance)

        await this.notificationsService.sendCashoutNotification(
          driver.userId,
          Number(driver.walletBalance),
          "processing",
        )
      } catch (error) {
        console.error(`Failed to process cashout for driver ${driver.userId}:`, error)
      }
    }
  }
}
