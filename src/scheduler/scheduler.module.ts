import { Module } from "@nestjs/common"
import { SchedulerService } from "./scheduler.service"
import { NotificationsModule } from "../notifications/notifications.module"
import { WalletModule } from "../wallet/wallet.module"

@Module({
  imports: [NotificationsModule, WalletModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
