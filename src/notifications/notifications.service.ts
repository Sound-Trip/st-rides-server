import { Injectable } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import { NotificationType } from "@prisma/client"

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    via = "push",
    metadata?: any,
  ) {
    // Save notification to database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        via,
        metadata,
      },
    })

    // Send actual notification based on type
    switch (via) {
      case "push":
        await this.sendPushNotification(userId, title, body, metadata)
        break
      case "sms":
        await this.sendSmsNotification(userId, body)
        break
      case "email":
        await this.sendEmailNotification(userId, title, body)
        break
    }

    return notification
  }

  async sendRideBookingNotification(rideId: string, passengerId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        route: true,
        driver: {
          include: {
            driverProfile: true,
          },
        },
      },
    })

    if (ride) {
      // Notify passenger
      await this.sendNotification(
        passengerId,
        NotificationType.PUSH,
        "Ride Booked Successfully",
        `Your ride from ${ride.route.startLocation} to ${ride.route.endLocation} has been booked.`,
        "push",
        { rideId, type: "ride_booked" },
      )

      // Notify driver
      await this.sendNotification(
        ride.driverId,
        NotificationType.PUSH,
        "New Ride Assignment",
        `You have a new ride assignment for ${ride.pickupTime.toLocaleString()}.`,
        "push",
        { rideId, type: "ride_assigned" },
      )
    }
  }

  async sendRideStartNotification(rideId: string, passengerId: string) {
    await this.sendNotification(
      passengerId,
      NotificationType.PUSH,
      "Ride Started",
      "Your ride has started. Have a safe journey!",
      "push",
      { rideId, type: "ride_started" },
    )
  }

  async sendRideCompletionNotification(rideId: string, passengerId: string) {
    await this.sendNotification(
      passengerId,
      NotificationType.PUSH,
      "Ride Completed",
      "Your ride has been completed. Please rate your experience.",
      "push",
      { rideId, type: "ride_completed" },
    )
  }

  async sendRideCancellationNotification(rideId: string, userId: string) {
    await this.sendNotification(
      userId,
      NotificationType.SMS,
      "Ride Cancelled",
      "Your ride has been cancelled. Any wallet payments have been refunded.",
      "sms",
      { rideId, type: "ride_cancelled" },
    )
  }

  async sendMaintenanceReminderNotification(driverId: string, dueDate: Date) {
    await this.sendNotification(
      driverId,
      NotificationType.PUSH,
      "Maintenance Due",
      `Your vehicle maintenance is due on ${dueDate.toDateString()}. Please schedule it soon.`,
      "push",
      { type: "maintenance_reminder", dueDate },
    )
  }

  async sendCashoutNotification(driverId: string, amount: number, status: string) {
    const title = status === "completed" ? "Cashout Completed" : "Cashout Processing"
    const body =
      status === "completed"
        ? `Your cashout of ₦${amount} has been processed successfully.`
        : `Your cashout request of ₦${amount} is being processed.`

    await this.sendNotification(driverId, NotificationType.EMAIL, title, body, "email", {
      type: "cashout",
      amount,
      status,
    })
  }

  private async sendPushNotification(userId: string, title: string, body: string, metadata?: any) {
    // Implement Firebase Cloud Messaging or similar
    console.log(`Push notification to ${userId}: ${title} - ${body}`)

    // Example Firebase implementation:
    /*
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data: metadata ? JSON.stringify(metadata) : undefined,
      });
    }
    */
  }

  private async sendSmsNotification(userId: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    })

    if (user?.phone) {
      console.log(`SMS to ${user.phone}: ${message}`)
      // Implement SMS sending logic
    }
  }

  private async sendEmailNotification(userId: string, subject: string, body: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (user?.email) {
      console.log(`Email to ${user.email}: ${subject} - ${body}`)
      // Implement email sending logic
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    })
  }

  async getUserNotifications(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
}
