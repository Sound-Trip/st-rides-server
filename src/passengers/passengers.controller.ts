import { Body, Controller, Delete, Patch, Post, UseGuards } from '@nestjs/common';
import { PassengersService } from './passengers.service';
import { CreateRequestDto, CreateScheduleDto } from './dto/update-location.dto';
import { Query, Get } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('passengers')
export class PassengersController {
    constructor(private svc: PassengersService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    updateLocation() { }

    @UseGuards(JwtAuthGuard)
    @Get('schedules')
    getSchedules(
        @Query('startJunctionId') s: string,
        @Query('endJunctionId') e: string,
        @Query('windowMinutes') w = '30',
    ) {
        const minutes = Number.isNaN(parseInt(w, 10)) ? 30 : parseInt(w, 10);
        return this.svc.smartScan(s, e, minutes);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/ride-requests')
    postRideRequests(
        @CurrentUser('id') passengerId: string,
        @Body() dto: CreateRequestDto
    ) {
        return this.svc.create(passengerId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('ride-requests')
    getRiderequest(
        @CurrentUser('id') passengerId: string,
    ) { return this.svc.getRideRequestd(passengerId); }

    @UseGuards(JwtAuthGuard)
    @Delete('ride-requests:id')
    deleteRiderequest() { }

    @UseGuards(JwtAuthGuard)
    @Post('chatter')
    chatterRide(
        @CurrentUser('id') passengerId: string,
        @Body() dto: CreateRequestDto
    ) {
        return this.svc.chatter(passengerId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('chatter')
    getChatteredRide(@CurrentUser('id') passengerId: string,) { return this.svc.getChatteredRides(passengerId)}


    @UseGuards(JwtAuthGuard)
    @Get('chatterv1')
    getChatteredRidev1(@CurrentUser('id') passengerId: string,) { return this.svc.getChatteredRides(passengerId)}


}
