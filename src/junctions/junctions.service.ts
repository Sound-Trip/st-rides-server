import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { VehicleType, RideType } from '../common/enums';

@Injectable()
export class JunctionsService {
    constructor(private prisma: PrismaService) { }

    async getJunctions() {
        const junctions = await this.prisma.junction.findMany({
            orderBy: { name: 'asc' },
            // take: 10,
        });

        return { junctions };
    }

}