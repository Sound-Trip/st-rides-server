import { Controller, Get, Post, UseGuards } from "@nestjs/common"
import type { NotificationsService } from "./notifications.service"
import type { DeviceTokensService } from "./device-tokens.service"
import type { NotificationDeliveryService } from "./notification-delivery.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private deviceTokensService: DeviceTokensService,
    private deliveryService: NotificationDeliveryService,
  ) {}

  @Get()
  async getUserNotifications(user: any) {
    return this.notificationsService.getUserNotifications(user.sub)
  }

  @Post(":id/read")
  async markAsRead(notificationId: string) {
    return this.notificationsService.markNotificationAsRead(notificationId)
  }

  @Post("mark-all-read")
  async markAllAsRead(user: any) {
    return this.notificationsService.markAllNotificationsAsRead(user.sub)
  }

  @Post("device-token/register")
  async registerDeviceToken(user: any, body: { token: string; deviceType: string }) {
    return this.deviceTokensService.registerDeviceToken(user.sub, body.token, body.deviceType)
  }

  @Post("device-token/unregister")
  async unregisterDeviceToken(user: any, body: { token: string }) {
    return this.deviceTokensService.unregisterDeviceToken(user.sub, body.token)
  }

  @Get("device-tokens")
  async getDeviceTokens(user: any) {
    return this.deviceTokensService.getUserDeviceTokens(user.sub)
  }

  @Get("preferences")
  async getPreferences(user: any) {
    return this.deliveryService.getUserNotificationPreferences(user.sub)
  }

  @Post("preferences")
  async updatePreferences(user: any, preferences: any) {
    return this.deliveryService.updateUserNotificationPreferences(user.sub, preferences)
  }

  @Get("stats")
  async getStats() {
    return this.deliveryService.getNotificationStats()
  }
}
