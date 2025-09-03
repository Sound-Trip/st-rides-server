import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomInt } from 'crypto';
import * as QR from 'qrcode';

function generateShortCode() {
  return (1000 + Math.floor(Math.random() * 9000)).toString();
}
function generateScanCode() {
  return crypto.randomUUID();
}

@Injectable()
export class RidesService {
  constructor(private prisma: PrismaService) { }

  async acceptRequestAsDriver(driverId:string, requestId: string) {
    return this.prisma.$transaction(async tx => {
      const req = await tx.rideRequest.findUnique({ where: { id: requestId } });
      if (!req || req.status !== 'PENDING') throw new Error('Request not available');

      // create or reuse a Ride for KEKE shared to aggregate multiple passengers
      const createRideData: any = {
        driverId,
        vehicleType: req.vehicleType,
        rideType: req.rideType,
        status: 'SCHEDULED',
        scanCode: generateScanCode(),
        shortCode: generateShortCode(),
        pickupTime: req.scheduledFor ?? new Date(),
        totalAmount: req.priceQuoted ?? 0,
        commission: 0,
        routeId: null,
        capacity: req.vehicleType === 'KEKE' ? 4 : (req.vehicleType === 'BUS' ? 14 : 1),
        seatsFilled: 0,
        requestedStartLat: req.startLat,
        requestedStartLng: req.startLng,
        requestedEndLat: req.endLat,
        requestedEndLng: req.endLng,
      };

      // attach route for KEKE if known
      if (req.vehicleType === 'KEKE') {
        const route = await tx.route.findFirst({
          where: {
            vehicleType: 'KEKE',
            startJunctionId: req.startJunctionId!,
            endJunctionId: req.endJunctionId!,
            isActive: true,
          },
        });
        if (route) createRideData.routeId = route.id;
      }

      const ride = await tx.ride.create({ data: createRideData });

      await tx.rideRequest.update({
        where: { id: req.id },
        data: { status: 'ACCEPTED', acceptedRideId: ride.id },
      });

      // notify passenger
      // this.events.emit('ride.accepted', { rideId: ride.id, passengerId: req.passengerId })

      return ride;
    });
  }

  async startRide(driverId: string, rideId: string, code: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride || ride.driverId !== driverId) throw new Error('Ride not found');
    if (ride.shortCode !== code) throw new Error('Invalid code');

    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'ONGOING', startTime: new Date() },
    });
  }

  async completeRide(rideId: string) {
    const ride = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'COMPLETED', endTime: new Date() },
    });
    // compute commission and payouts here
    return ride;
  }

  async getCode(rideId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    const payload = JSON.stringify({ rideId, shortCode: ride.shortCode });
    const dataUrl = await QR.toDataURL(payload);
    return { shortCode: ride.shortCode, qrDataUrl: dataUrl };
  }
}