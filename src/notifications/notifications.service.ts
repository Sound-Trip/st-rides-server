import { Injectable, Logger } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import type { NotificationsGateway } from "./websocket.gateway"
import type { DeviceTokensService } from "./device-tokens.service"
import * as admin from "firebase-admin"
import { NotificationType, UserRole } from "@prisma/client"

@Injectable()
export class NotificationsService {
  private logger = new Logger("NotificationsService")
  private firebaseApp: admin.app.App

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private deviceTokensService: DeviceTokensService,
  ) {
    this.initializeFirebase()
  }

  private initializeFirebase() {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null

      if (!serviceAccountKey) {
        this.logger.warn("Firebase service account key not configured. FCM will be disabled.")
        return
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
      })

      this.logger.log("Firebase Admin SDK initialized")
    } catch (error) {
      this.logger.error("Failed to initialize Firebase:", error)
    }
  }

  async createNotification(userId: string, type: NotificationType, title: string, body: string, metadata?: any) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          via: "PUSH",
          metadata: metadata || {},
        },
      })

      return notification
    } catch (error) {
      this.logger.error("Failed to create notification:", error)
      throw error
    }
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    try {
      if (!this.firebaseApp) {
        this.logger.warn("Firebase not initialized, skipping FCM")
        return
      }

      const deviceTokens = await this.deviceTokensService.getDeviceTokens(userId)

      if (deviceTokens.length === 0) {
        this.logger.debug(`No device tokens found for user ${userId}`)
        return
      }

      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: deviceTokens,
      }

      const response = await admin.messaging().sendEachForMulticast(message)

      this.logger.log(`FCM sent to user ${userId}: ${response.successCount} succeeded, ${response.failureCount} failed`)

      // Handle failed tokens
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(`Failed to send to token ${deviceTokens[idx]}: ${resp.error}`)
            // Deactivate invalid tokens
            if (resp.error?.code === "messaging/invalid-registration-token") {
              this.deviceTokensService.unregisterDeviceToken(userId, deviceTokens[idx])
            }
          }
        })
      }

      return response
    } catch (error) {
      this.logger.error("Failed to send FCM notification:", error)
    }
  }

  async sendRealtimeNotification(userId: string, title: string, body: string, data?: any) {
    try {
      const notification = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        body,
        data,
        timestamp: new Date(),
      }

      this.notificationsGateway.sendNotificationToUser(userId, notification)
      this.logger.log(`Real-time notification sent to user ${userId}`)

      return notification
    } catch (error) {
      this.logger.error("Failed to send real-time notification:", error)
    }
  }

  async sendNotification(userId: string, title: string, body: string, data?: any) {
    try {
      // Save to database
      await this.createNotification(userId, "PUSH", title, body, data)

      // Send real-time via WebSocket
      await this.sendRealtimeNotification(userId, title, body, data)

      await this.sendPushNotification(userId, title, body, data)

      this.logger.log(`Notification sent to user ${userId}`)
    } catch (error) {
      this.logger.error("Failed to send notification:", error)
    }
  }

  async sendNotificationToRole(role: UserRole, title: string, body: string, data?: any) {
    try {
      const users = await this.prisma.user.findMany({
        where: { role },
      })

      for (const user of users) {
        await this.sendNotification(user.id, title, body, data)
      }

      this.logger.log(`Notification sent to ${users.length} users with role ${role}`)
    } catch (error) {
      this.logger.error("Failed to send role-based notification:", error)
    }
  }

  async getUserNotifications(userId: string, limit = 20) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      })

      return notifications
    } catch (error) {
      this.logger.error("Failed to get user notifications:", error)
      throw error
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const notification = await this.prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })

      return notification
    } catch (error) {
      this.logger.error("Failed to mark notification as read:", error)
      throw error
    }
  }

  async markAllNotificationsAsRead(userId: string) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })

      return result
    } catch (error) {
      this.logger.error("Failed to mark all notifications as read:", error)
      throw error
    }
  }
}
