import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { NotificationsService } from "./notifications.service"
import { NotificationsGateway } from "./websocket.gateway"
import { NotificationsController } from "./notifications.controller"
import { DeviceTokensService } from "./device-tokens.service"
import { NotificationDeliveryService } from "./notification-delivery.service"
import { EventBroadcasterService } from "./event-broadcaster.service"
import { PrismaModule } from "../prisma/prisma.module"

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
    }),
  ],
  providers: [
    NotificationsService,
    NotificationsGateway,
    DeviceTokensService,
    NotificationDeliveryService,
    EventBroadcasterService,
  ],
  controllers: [NotificationsController],
  exports: [
    NotificationsService,
    NotificationsGateway,
    DeviceTokensService,
    NotificationDeliveryService,
    EventBroadcasterService,
  ],
})
export class NotificationsModule {}
