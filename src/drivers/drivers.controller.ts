import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Query, Get } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('drivers/me')
export class DriversController {
    constructor(private svc: DriversService) { }

    @UseGuards(JwtAuthGuard)
    @Patch('location')
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
}
