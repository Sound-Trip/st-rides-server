import { Injectable, Logger } from "@nestjs/common"
import type { NotificationsGateway } from "./websocket.gateway"

@Injectable()
export class EventBroadcasterService {
  private logger = new Logger("EventBroadcasterService")

  constructor(private notificationsGateway: NotificationsGateway) {}

  /**
   * Broadcast ride update to all connected clients for that ride
   */
  broadcastRideUpdate(rideId: string, update: any) {
    try {
      this.notificationsGateway.sendRideUpdate(rideId, {
        rideId,
        ...update,
        timestamp: new Date(),
      })
      this.logger.debug(`Broadcasted ride update for ride ${rideId}`)
    } catch (error) {
      this.logger.error("Error broadcasting ride update:", error)
    }
  }

  /**
   * Broadcast ride status change
   */
  broadcastRideStatusChange(rideId: string, status: string, details?: any) {
    this.broadcastRideUpdate(rideId, {
      type: "STATUS_CHANGE",
      status,
      details,
    })
  }

  /**
   * Broadcast driver location update
   */
  broadcastDriverLocationUpdate(driverId: string, rideId: string, lat: number, lng: number) {
    this.broadcastRideUpdate(rideId, {
      type: "DRIVER_LOCATION",
      driverId,
      location: { lat, lng },
    })
  }

  /**
   * Broadcast passenger joined ride
   */
  broadcastPassengerJoined(rideId: string, passengerId: string, passengerName: string) {
    this.broadcastRideUpdate(rideId, {
      type: "PASSENGER_JOINED",
      passengerId,
      passengerName,
    })
  }

  /**
   * Broadcast passenger left ride
   */
  broadcastPassengerLeft(rideId: string, passengerId: string, passengerName: string) {
    this.broadcastRideUpdate(rideId, {
      type: "PASSENGER_LEFT",
      passengerId,
      passengerName,
    })
  }

  /**
   * Broadcast ride started
   */
  broadcastRideStarted(rideId: string, driverId: string, startTime: Date) {
    this.broadcastRideStatusChange(rideId, "ONGOING", {
      driverId,
      startTime,
    })
  }

  /**
   * Broadcast ride completed
   */
  broadcastRideCompleted(rideId: string, endTime: Date, totalAmount: number) {
    this.broadcastRideStatusChange(rideId, "COMPLETED", {
      endTime,
      totalAmount,
    })
  }

  /**
   * Broadcast ride cancelled
   */
  broadcastRideCancelled(rideId: string, cancelledBy: string, reason: string) {
    this.broadcastRideStatusChange(rideId, "CANCELLED", {
      cancelledBy,
      reason,
    })
  }

  /**
   * Broadcast driver accepted ride request
   */
  broadcastRideAccepted(rideId: string, driverId: string, driverName: string, pickupTime: Date) {
    this.broadcastRideUpdate(rideId, {
      type: "RIDE_ACCEPTED",
      driverId,
      driverName,
      pickupTime,
    })
  }

  /**
   * Broadcast ETA update
   */
  broadcastETAUpdate(rideId: string, eta: number) {
    this.broadcastRideUpdate(rideId, {
      type: "ETA_UPDATE",
      eta, // in seconds
    })
  }

  /**
   * Broadcast driver rating update
   */
  broadcastDriverRatingUpdate(driverId: string, newRating: number, totalRides: number) {
    this.notificationsGateway.sendNotificationToUser(driverId, {
      type: "DRIVER_RATING_UPDATE",
      newRating,
      totalRides,
      timestamp: new Date(),
    })
  }

  /**
   * Broadcast system announcement to all users
   */
  broadcastSystemAnnouncement(title: string, body: string, data?: any) {
    this.notificationsGateway.broadcastNotification({
      type: "SYSTEM_ANNOUNCEMENT",
      title,
      body,
      data,
      timestamp: new Date(),
    })
    this.logger.log(`System announcement broadcasted: ${title}`)
  }

  /**
   * Broadcast to specific role (DRIVER, PASSENGER, ADMIN)
   */
  broadcastToRole(role: string, title: string, body: string, data?: any) {
    this.notificationsGateway.sendNotificationToRole(role, {
      type: "ROLE_BROADCAST",
      title,
      body,
      data,
      timestamp: new Date(),
    })
    this.logger.log(`Broadcasted to role ${role}: ${title}`)
  }

  /**
   * Broadcast to specific user
   */
  broadcastToUser(userId: string, title: string, body: string, data?: any) {
    this.notificationsGateway.sendNotificationToUser(userId, {
      type: "USER_NOTIFICATION",
      title,
      body,
      data,
      timestamp: new Date(),
    })
  }

  /**
   * Join user to ride room for live updates
   */
  joinRideRoom(userId: string, rideId: string) {
    this.notificationsGateway.joinRideRoom(userId, rideId)
    this.logger.debug(`User ${userId} joined ride room ${rideId}`)
  }

  /**
   * Leave user from ride room
   */
  leaveRideRoom(userId: string, rideId: string) {
    this.notificationsGateway.leaveRideRoom(userId, rideId)
    this.logger.debug(`User ${userId} left ride room ${rideId}`)
  }
}
