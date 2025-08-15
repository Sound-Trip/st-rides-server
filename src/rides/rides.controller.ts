import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common"
import { RidesService } from "./rides.service"
import { MatchingService } from "./matching.service"
import { Roles } from "../common/decorators/roles.decorator"
import { RolesGuard } from "../common/guards/roles.guard"
import { UserRole, type VehicleType, type PaymentMethod, type RideStatus } from "@prisma/client"

@Controller("rides")
@UseGuards(RolesGuard)
export class RidesController {
  constructor(
    private ridesService: RidesService,
    private matchingService: MatchingService,
  ) {}

  @Post("book")
  @Roles(UserRole.PASSENGER)
  async bookRide(
    user: any,
    @Body() bookingData: {
      routeId: string;
      pickupTime: string;
      vehicleType: VehicleType;
      paymentMethod: PaymentMethod;
    },
  ) {
    return this.ridesService.bookRide(user.id, {
      ...bookingData,
      pickupTime: new Date(bookingData.pickupTime),
    })
  }

  @Post(":scanCode/start")
  @Roles(UserRole.DRIVER)
  async startRide(user: any, @Param('scanCode') scanCode: string) {
    return this.ridesService.startRide(user.id, scanCode)
  }

  @Post(":id/complete")
  @Roles(UserRole.DRIVER)
  async completeRide(user: any, @Param('id') rideId: string) {
    return this.ridesService.completeRide(user.id, rideId)
  }

  @Post(":id/cancel")
  async cancelRide(user: any, @Param('id') rideId: string, @Body() cancelData: { reason?: string }) {
    return this.ridesService.cancelRide(user.id, rideId, cancelData.reason)
  }

  @Post(":id/rate")
  @Roles(UserRole.PASSENGER)
  async rateRide(user: any, @Param('id') rideId: string, @Body() ratingData: { rating: number; feedback?: string }) {
    return this.ridesService.rateRide(user.id, rideId, ratingData.rating, ratingData.feedback)
  }

  @Get("passenger")
  @Roles(UserRole.PASSENGER)
  async getPassengerRides(user: any, @Query('status') status?: RideStatus) {
    return this.ridesService.getPassengerRides(user.id, status)
  }

  @Get("driver")
  @Roles(UserRole.DRIVER)
  async getDriverRides(user: any, @Query('status') status?: RideStatus) {
    return this.ridesService.getDriverRides(user.id, status)
  }

  @Get("driver/recommendations")
  @Roles(UserRole.DRIVER)
  async getDriverRecommendations(user: any) {
    return this.matchingService.getDriverRecommendations(user.id)
  }
}
