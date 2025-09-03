import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VehicleType, RideType } from '../common/enums';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async create(passengerId: string, dto: any) {

    if (dto.vehicleType === VehicleType.KEKE) {
      // optional: check for matching driver schedules first and return suggestions
      const schedules = await this.prisma.driverSchedule.findMany({
        where: {
          vehicleType: 'KEKE',
          startJunctionId: dto.startJunctionId,
          endJunctionId: dto.endJunctionId,
          isActive: true,
          departureTime: dto.scheduledFor
            ? { gte: new Date(dto.scheduledFor) }
            : { gte: new Date() },
        },
        orderBy: { departureTime: 'asc' },
        take: 10,
      });

      // create request regardless, for smart scan notifications
      const price = await this.quoteKeke(dto.startJunctionId, dto.endJunctionId);
      const req = await this.prisma.rideRequest.create({
        data: {
          passengerId,
          vehicleType: 'KEKE',
          rideType: RideType.SHARED,
          startJunctionId: dto.startJunctionId,
          endJunctionId: dto.endJunctionId,
          scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
          seatsNeeded: dto.seatsNeeded ?? 1,
          priceQuoted: price,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // emit to drivers nearby junctions
      // this.events.emit('ride.request.created', req)

      return { request: req, matchingSchedules: schedules };
    }

    // CAR or BUS private
    const distanceKm = this.haversine(dto.startLat, dto.startLng, dto.endLat, dto.endLng);
    const price = await this.quoteByDistance(distanceKm, dto.vehicleType);

    const req = await this.prisma.rideRequest.create({
      data: {
        passengerId,
        vehicleType: dto.vehicleType,
        rideType: RideType.PRIVATE,
        startLat: dto.startLat,
        startLng: dto.startLng,
        endLat: dto.endLat,
        endLng: dto.endLng,
        seatsNeeded: dto.seatsNeeded ?? 1,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        priceQuoted: price,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // push to nearby drivers of that type
    // this.events.emit('ride.request.created', req)

    return { request: req };
  }

  private haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
    const R = 6371, toRad = (n: number) => (n * Math.PI) / 180;
    const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1 + s2));
  }

  private async quoteKeke(startJunctionId: string, endJunctionId: string) {
    const route = await this.prisma.route.findFirst({
      where: { vehicleType: 'KEKE', startJunctionId, endJunctionId, isActive: true },
    });
    if (!route) throw new Error('Route not available');
    return route.basePrice; // add surge later
  }

  private async quoteByDistance(distanceKm: number, vehicleType: VehicleType) {
    const base = vehicleType === VehicleType.CAR ? 600 : 1200; // NGN example
    const perKm = vehicleType === VehicleType.CAR ? 250 : 200; // tweak for bus
    const minFare = vehicleType === VehicleType.CAR ? 1200 : 2000;
    const fare = Math.max(minFare, base + perKm * distanceKm);
    return Math.round(fare);
  }
}