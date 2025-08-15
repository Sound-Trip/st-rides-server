import { Controller, Get, Post, Patch, Param, Query, Body } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationType } from "@prisma/client";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Get notifications for a specific user
   */
  @Get(":userId")
  async getUserNotifications(
    @Param("userId") userId: string,
    @Query("limit") limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.notificationsService.getUserNotifications(userId, limitNum);
  }

  /**
   * Mark a notification as read
   */
  @Patch(":userId/:notificationId/read")
  async markAsRead(
    @Param("userId") userId: string,
    @Param("notificationId") notificationId: string
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  /**
   * Send a generic notification
   * This is mostly for testing / admin-triggered messages
   */
  @Post("send")
  async sendNotification(
    @Body()
    body: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      via?: "push" | "sms" | "email";
      metadata?: any;
    }
  ) {
    return this.notificationsService.sendNotification(
      body.userId,
      body.type,
      body.title,
      body.message,
      body.via ?? "push",
      body.metadata
    );
  }
}