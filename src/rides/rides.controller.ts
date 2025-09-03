import { Body, Controller, Param, Post, Get, UseGuards } from '@nestjs/common';
import { RidesService } from './rides.service';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('rides')
export class RidesController {
  constructor(private svc: RidesService) { }

  @UseGuards(JwtAuthGuard)
  @Post(':requestId/accept')
  accept(
    @CurrentUser('id') driverId: string,
    @Param('requestId') requestId: string
  ) {
    return this.svc.acceptRequestAsDriver(driverId, requestId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':rideId/start')
  start(
    @CurrentUser('id') driverId: string,
    @Param('rideId') rideId: string, 
    @Body() body: { code: string }
  ) {
    return this.svc.startRide(driverId, rideId, body.code);
  }

  @Post(':rideId/complete')
  complete(@Param('rideId') rideId: string) {
    return this.svc.completeRide(rideId);
  }

  @Get(':rideId/code')
  getCode(@Param('rideId') rideId: string) {
    return this.svc.getCode(rideId);
  }
}