import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ScheduleModule } from "@nestjs/schedule"
import { ThrottlerModule } from "@nestjs/throttler"
import { APP_GUARD } from "@nestjs/core"

import { PrismaModule } from "./prisma/prisma.module"
import { AuthModule } from "./auth/auth.module"
// import { UsersModule } from "./users/users.module"
// import { DriversModule } from "./drivers/drivers.module"
// import { PassengersModule } from "./passengers/passengers.module"
import { RidesModule } from "./rides/rides.module"
import { RoutesModule } from "./routes/routes.module"
import { WalletModule } from "./wallet/wallet.module"
import { AdminModule } from "./admin/admin.module"
// import { MaintenanceModule } from "./maintenance/maintenance.module"
import { NotificationsModule } from "./notifications/notifications.module"
import { SchedulerModule } from "./scheduler/scheduler.module"
import { CommonModule } from "./common/common.module"
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard"
import { ThrottlerGuard } from "@nestjs/throttler"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    CommonModule,
    AuthModule,
    // UsersModule,
    // DriversModule,
    // PassengersModule,
    RidesModule,
    RoutesModule,
    WalletModule,
    AdminModule,
    // MaintenanceModule,
    NotificationsModule,
    SchedulerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
