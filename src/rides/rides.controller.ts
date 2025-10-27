import { Body, Controller, Param, Post, Get, UseGuards } from "@nestjs/common"
import type { RidesService } from "./rides.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from "../auth/decorators/current-user.decorator"

@Controller("rides")
export class RidesController {
  constructor(private svc: RidesService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getRide(@Param('id') rideId: string) {
    return this.svc.getRideDetails(rideId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":requestId/accept")
  accept(@CurrentUser('id') driverId: string, @Param('requestId') requestId: string) {
    return this.svc.acceptRequestAsDriver(driverId, requestId)
  }

  @UseGuards(JwtAuthGuard)
  @Post(":rideId/start")
  start(@CurrentUser('id') driverId: string, @Param('rideId') rideId: string, @Body() body: { code: string }) {
    return this.svc.startRide(driverId, rideId, body.code)
  }

  @Post(':rideId/complete')
  complete(@Param('rideId') rideId: string) {
    return this.svc.completeRide(rideId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":rideId/cancel")
  cancelRide(@CurrentUser('id') userId: string, @Param('rideId') rideId: string, @Body('reason') reason: string) {
    return this.svc.cancelRide(userId, rideId, reason)
  }

  @Get(':rideId/code')
  getCode(@Param('rideId') rideId: string) {
    return this.svc.getCode(rideId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":rideId/confirm")
  confirmRide(@CurrentUser('id') passengerId: string, @Param('rideId') rideId: string) {
    return this.svc.confirmRide(passengerId, rideId)
  }

  @UseGuards(JwtAuthGuard)
  @Post(":rideId/rate")
  rateRide(@CurrentUser('id') passengerId: string, @Param('rideId') rideId: string, @Body('rating') rating: number) {
    return this.svc.rateRide(passengerId, rideId, rating)
  }

  @UseGuards(JwtAuthGuard)
  @Post("grouped/accept")
  acceptGroupedRequests(@CurrentUser('id') driverId: string, @Body('requestIds') requestIds: string[]) {
    return this.svc.acceptGroupedRequests(driverId, requestIds)
  }
}
