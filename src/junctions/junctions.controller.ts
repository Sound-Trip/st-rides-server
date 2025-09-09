import { Body, Controller, Delete, Patch, Post, UseGuards } from '@nestjs/common';
import { JunctionsService } from './junctions.service';
import { CreateRequestDto, CreateScheduleDto } from './dto/junctions.dto';
import { Query, Get } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('junctions')
export class JunctionsController {
    constructor(private svc: JunctionsService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    create(
        // @CurrentUser('id') passengerId: string,
        // @Body() dto: CreateRequestDto
    ) {
        return this.svc.getJunctions();
    }


}
