import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('requests')
export class RequestsController {
  constructor(private svc: RequestsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('id') passengerId: string,
    @Body() dto: CreateRequestDto
  ) {
    return this.svc.create(passengerId, dto);
  }
}