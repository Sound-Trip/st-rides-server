import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import type { PrismaService } from "../prisma/prisma.service"
import type { NotificationsService } from "./notifications.service"

@Injectable()
export class NotificationDeliveryService {
  private logger = new Logger("NotificationDeliveryService")

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Retry failed notifications every 5 minutes
   * Attempts to resend notifications that failed to deliver
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedNotifications() {
    try {
      this.logger.debug("Checking for failed notifications to retry...")

      const failedNotifications = await this.prisma.notification.findMany({
        where: {
          isRead: false,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        take: 100,
      })

      if (failedNotifications.length === 0) {
        return
      }

      this.logger.log(`Found ${failedNotifications.length} notifications to check`)

      for (const notification of failedNotifications) {
        try {
          await this.notificationsService.sendPushNotification(
            notification.userId,
            notification.title,
            notification.body,
            notification.metadata as any,
          )
        } catch (error) {
          this.logger.warn(`Failed to retry notification ${notification.id}:`, error)
        }
      }
    } catch (error) {
      this.logger.error("Error in retry failed notifications:", error)
    }
  }

  /**
   * Clean up old read notifications every day
   * Keeps database clean by removing old notifications
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    try {
      this.logger.debug("Cleaning up old notifications...")

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      })

      this.logger.log(`Deleted ${result.count} old notifications`)
    } catch (error) {
      this.logger.error("Error cleaning up old notifications:", error)
    }
  }

  /**
   * Get notification statistics for monitoring
   */
  async getNotificationStats() {
    try {
      const totalNotifications = await this.prisma.notification.count()
      const unreadNotifications = await this.prisma.notification.count({
        where: { isRead: false },
      })
      const notificationsLast24h = await this.prisma.notification.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      })

      return {
        totalNotifications,
        unreadNotifications,
        notificationsLast24h,
        readRate: totalNotifications > 0 ? ((totalNotifications - unreadNotifications) / totalNotifications) * 100 : 0,
      }
    } catch (error) {
      this.logger.error("Error getting notification stats:", error)
      throw error
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserNotificationPreferences(userId: string) {
    try {
      const key = `notification_prefs:${userId}`
      const prefs = await this.prisma.systemConfig.findUnique({ where: { key } })

      if (!prefs) {
        return {
          pushEnabled: true,
          emailEnabled: false,
          smsEnabled: false,
          rideUpdates: true,
          promotions: false,
          systemAlerts: true,
        }
      }

      return JSON.parse(prefs.value)
    } catch (error) {
      this.logger.error("Error getting user preferences:", error)
      return null
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserNotificationPreferences(userId: string, preferences: any) {
    try {
      const key = `notification_prefs:${userId}`

      await this.prisma.systemConfig.upsert({
        where: { key },
        update: { value: JSON.stringify(preferences) },
        create: { key, value: JSON.stringify(preferences) },
      })

      this.logger.log(`Updated notification preferences for user ${userId}`)
      return preferences
    } catch (error) {
      this.logger.error("Error updating user preferences:", error)
      throw error
    }
  }

  /**
   * Send bulk notifications to a user segment
   */
  async sendBulkNotification(userIds: string[], title: string, body: string, data?: any) {
    try {
      this.logger.log(`Sending bulk notification to ${userIds.length} users`)

      const results = {
        success: 0,
        failed: 0,
        errors: [] as any[],
      }

      for (const userId of userIds) {
        try {
          await this.notificationsService.sendNotification(userId, title, body, data)
          results.success++
        } catch (error) {
          results.failed++
          results.errors.push({ userId, error: String(error) })
        }
      }

      this.logger.log(`Bulk notification sent: ${results.success} succeeded, ${results.failed} failed`)
      return results
    } catch (error) {
      this.logger.error("Error sending bulk notification:", error)
      throw error
    }
  }

  /**
   * Send targeted notifications to drivers by role
   */
  async notifyDrivers(title: string, body: string, data?: any) {
    try {
      const drivers = await this.prisma.user.findMany({
        where: { role: "DRIVER" },
        select: { id: true },
      })

      const driverIds = drivers.map((d) => d.id)
      return this.sendBulkNotification(driverIds, title, body, data)
    } catch (error) {
      this.logger.error("Error notifying drivers:", error)
      throw error
    }
  }

  /**
   * Send targeted notifications to passengers by role
   */
  async notifyPassengers(title: string, body: string, data?: any) {
    try {
      const passengers = await this.prisma.user.findMany({
        where: { role: "PASSENGER" },
        select: { id: true },
      })

      const passengerIds = passengers.map((p) => p.id)
      return this.sendBulkNotification(passengerIds, title, body, data)
    } catch (error) {
      this.logger.error("Error notifying passengers:", error)
      throw error
    }
  }

  /**
   * Send targeted notifications to admins by role
   */
  async notifyAdmins(title: string, body: string, data?: any) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      })

      const adminIds = admins.map((a) => a.id)
      return this.sendBulkNotification(adminIds, title, body, data)
    } catch (error) {
      this.logger.error("Error notifying admins:", error)
      throw error
    }
  }
}
