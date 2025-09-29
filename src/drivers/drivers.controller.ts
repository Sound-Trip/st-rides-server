import { Body, Controller, Delete, Patch, Post, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { UpdateLocationDto, CreateScheduleDto } from './dto/update-location.dto';
import { Query, Get } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('drivers')
export class DriversController {
    constructor(private svc: DriversService) { }

    @UseGuards(JwtAuthGuard)
    @Patch('me/location')
    updateLocation(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateLocationDto
    ) {
        return this.svc.updateLocationForCurrentDriver(userId, dto);
    }

    @Get('/nearby-requests')
    nearbyRequests(
        @Query('vehicleType') vehicleType: 'KEKE' | 'CAR' | 'BUS',
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radiusMeters') radiusMeters = '3000',
    ) {
        return this.svc.findNearbyRideRequests({
            vehicleType,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radiusMeters: parseInt(radiusMeters, 10),
        });
    }

    @UseGuards(JwtAuthGuard)
    @Post('schedules')
    postSchedule(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateScheduleDto
    ) {
        return this.svc.create(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('schedules')
    getSchedules(
        @CurrentUser('id') userId: string,
    ) {
        return this.svc.getPostedScheduled(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('schedules/:id')
    editSchedule() { }

    @UseGuards(JwtAuthGuard)
    @Delete('schedules/:id')
    deleteSchedule() { }

    @UseGuards(JwtAuthGuard)
    @Get('smartScan')
    smartScan(
        @Query('startJunctionId') s: string,
        @Query('endJunctionId') e: string,
        @Query('windowMinutes') w = '30',
    ) {
        return this.svc.smartScan(s, e, parseInt(w, 10));
    }
}
