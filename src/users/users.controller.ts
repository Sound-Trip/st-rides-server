import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
// import { CreateRequestDto, CreateScheduleDto } from './dto/update-location.dto';
import { Query, Get } from '@nestjs/common';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private svc: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    getUser(@Param('id') userId: string) {
        return this.svc.getUser(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('me')
    editUser(
        @Query('id') userId: string,
    ) { return this.svc.getUser(userId) }

    @UseGuards(JwtAuthGuard)
    @Delete('me')
    deleteUser(
        @Query('id') userId: string,
    ) { return this.svc.getUser(userId) }


}
