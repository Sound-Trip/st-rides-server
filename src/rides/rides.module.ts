import { Module } from "@nestjs/common"
import { RidesService } from "./rides.service"
import { RidesController } from "./rides.controller"
import { RideMatcherService } from "./ride-matcher.service"
import { NotificationsModule } from "../notifications/notifications.module"
// import { MatchingService } from "./matching.service"
// import { WalletModule } from "../wallet/wallet.module"

@Module({
  imports: [NotificationsModule],
  controllers: [RidesController],
  providers: [RidesService, RideMatcherService],
  exports: [RidesService],
})
export class RidesModule { }
