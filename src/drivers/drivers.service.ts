import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DriversService {
    constructor(private prisma: PrismaService) { }

    async updateLocationForCurrentDriver(userId: string, dto: { lat: number; lng: number; isOnline: boolean; isAvailable?: boolean }) {
        return this.prisma.driverProfile.update({
            where: { userId },
            data: {
                currentLat: dto.lat,
                currentLng: dto.lng,
                isOnline: dto.isOnline,
                ...(dto.isAvailable !== undefined ? { isAvailable: dto.isAvailable } : {}),
                lastPingAt: new Date(),
            },
        });
    }

    async findNearbyRideRequests(params: { vehicleType: string; lat: number; lng: number; radiusMeters: number }) {
        const { vehicleType, lat, lng, radiusMeters } = params;
        const km = radiusMeters / 1000;

        // coarse prefilter by bounding box to keep it fast
        const latDelta = km / 111.0;
        const lngDelta = km / 111.0;

        const requests = await this.prisma.rideRequest.findMany({
            where: {
                vehicleType: vehicleType as any,
                status: 'PENDING',
                // free form requests only here. KEKE smart notifications are handled by schedule scan below.
                startLat: { not: null },
                startLng: { not: null },
            },
            take: 200,
        });

        const withDistance = requests
            .map(r => ({
                r,
                dKm: haversineKm(lat, lng, r.startLat!, r.startLng!),
            }))
            .filter(x => x.dKm <= km)
            .sort((a, b) => a.dKm - b.dKm)
            .slice(0, 50)
            .map(x => ({ ...x.r, distanceKm: x.dKm }));

        return withDistance;
    }

}


function  haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
        const toRad = (n: number) => (n * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(bLat - aLat);
        const dLng = toRad(bLng - aLng);
        const s1 = Math.sin(dLat / 2) ** 2;
        const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(s1 + s2));
    }