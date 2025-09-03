import { Module } from "@nestjs/common"
import { RidesService } from "./rides.service"
import { RidesController } from "./rides.controller"
// import { MatchingService } from "./matching.service"
// import { NotificationsModule } from "../notifications/notifications.module"
// import { WalletModule } from "../wallet/wallet.module"

@Module({
  // imports: [NotificationsModule, WalletModule],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
