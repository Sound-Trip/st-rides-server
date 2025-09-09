import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { VehicleType, RideType } from '../common/enums';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getUser(userId: string,) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                passengerProfile: true,
                driverProfile: true,
            },
        })
        if (!user) throw new UnauthorizedException("User not found");

        return {
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
                role: user.role,
                profile: user.passengerProfile || user.driverProfile,
            }
        };
    }
}