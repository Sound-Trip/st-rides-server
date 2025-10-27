import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayInit,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets"
import type { Server, Socket } from "socket.io"
import { Injectable, Logger } from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/notifications",
})
@Injectable()
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private logger = new Logger("NotificationsGateway")
  private userSockets: Map<string, Set<string>> = new Map() // userId -> Set of socketIds

  constructor(private jwtService: JwtService) { }

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized")
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token
      if (!token) {
        this.logger.warn("Connection attempt without token")
        client.disconnect()
        return
      }

      const decoded = this.jwtService.verify(token)
      const userId = decoded.sub

      if (!userId) {
        client.disconnect()
        return
      }

      // Track user socket connections
      // Track user socket connections safely
      const sockets = this.userSockets.get(userId) ?? new Set()
      sockets.add(client.id)
      this.userSockets.set(userId, sockets)

      // Join user-specific room for targeted notifications
      client.join(`user:${userId}`)
      client.join(`role:${decoded.role}`) // Join role-based room (DRIVER, PASSENGER, ADMIN)

      this.logger.log(`Client ${client.id} connected for user ${userId}`)
    } catch (error) {
      this.logger.error("Connection error:", error)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    // Remove socket from tracking
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.has(client.id)) {
        sockets.delete(client.id)
        if (sockets.size === 0) {
          this.userSockets.delete(userId)
        }
        this.logger.log(`Client ${client.id} disconnected for user ${userId}`)
        break
      }
    }
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification", notification)
  }

  sendNotificationToRole(role: string, notification: any) {
    this.server.to(`role:${role}`).emit("notification", notification)
  }

  broadcastNotification(notification: any) {
    this.server.emit("notification", notification)
  }

  sendRideUpdate(rideId: string, update: any) {
    this.server.to(`ride:${rideId}`).emit("ride:update", update)
  }

  joinRideRoom(userId: string, rideId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.sockets.sockets.get(socketId)?.join(`ride:${rideId}`)
      })
    }
  }

  leaveRideRoom(userId: string, rideId: string) {
    const sockets = this.userSockets.get(userId)
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.sockets.sockets.get(socketId)?.leave(`ride:${rideId}`)
      })
    }
  }

  @SubscribeMessage("ping")
  handlePing(client: Socket, data: any) {
    return { event: "pong", data }
  }
}
