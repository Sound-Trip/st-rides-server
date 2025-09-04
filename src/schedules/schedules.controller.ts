import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('schedules')
export class SchedulesController {
  constructor(private svc: SchedulesService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateScheduleDto
  ) {
    return this.svc.create(userId, dto);
  }

  @Get('matches')
  matches(
    @Query('startJunctionId') s: string,
    @Query('endJunctionId') e: string,
    @Query('windowMinutes') w = '30',
  ) {
    return this.svc.smartScan(s, e, parseInt(w, 10));
  }

  
  // 🚏 Passengers — View KEKE schedules
  @UseGuards(JwtAuthGuard)
  @Get('keke/schedules')
  getKekeSchedules() {
    return this.svc.getAvailableKekeSchedules();
  }
}