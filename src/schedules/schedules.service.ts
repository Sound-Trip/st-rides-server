import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: { startJunctionId: string; endJunctionId: string; departureTime: string; capacity: number }) {
        // enforce KEKE
        const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
        if (!driver || driver.vehicleType !== 'KEKE') throw new Error('Only KEKE can create schedules');

        return this.prisma.driverSchedule.create({
            data: {
                driverId: userId,
                vehicleType: 'KEKE',
                startJunctionId: dto.startJunctionId,
                endJunctionId: dto.endJunctionId,
                departureTime: new Date(dto.departureTime),
                capacity: dto.capacity ?? 4,
            },
        });
    }

    async smartScan(startJunctionId: string, endJunctionId: string, windowMinutes: number) {
        const now = new Date();
        const windowEnd = new Date(now.getTime() + windowMinutes * 60000);
        // Count current demand for this exact pair that is pending now
        const pending = await this.prisma.rideRequest.findMany({
            where: {
                vehicleType: 'KEKE',
                rideType: 'SHARED',
                status: 'PENDING',
                startJunctionId,
                endJunctionId,
            },
        });

        // Also show upcoming schedules from other drivers for awareness
        const schedules = await this.prisma.driverSchedule.findMany({
            where: {
                startJunctionId,
                endJunctionId,
                vehicleType: 'KEKE',
                isActive: true,
                departureTime: { gte: now, lte: windowEnd },
            },
            orderBy: { departureTime: 'asc' },
            take: 10,
        });

        return { pendingCount: pending.length, schedules };
    }

    async getAvailableKekeSchedules() {
        return this.prisma.driverSchedule.findMany({
            where: {
                vehicleType: 'KEKE',
                isActive: true,
                seatsFilled: { lt: 4 }, // assume KEKE capacity = 4 unless overridden
                departureTime: { gte: new Date() },
            },
            include: {
                driver: { select: { firstName: true, lastName: true, phone: true } },
                startJunction: true,
                endJunction: true,
            },
            orderBy: { departureTime: 'asc' },
        });
    }
}