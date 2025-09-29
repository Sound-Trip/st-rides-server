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

    async create(userId: string, dto: { startJunctionId: string; endJunctionId: string; departureTime: string; capacity: number }) {
        // enforce KEKE
        const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
        if (!driver || driver.vehicleType !== 'KEKE') throw new Error('Only KEKE can create schedules');

        const req = await this.prisma.driverSchedule.create({
            data: {
                driverId: userId,
                vehicleType: 'KEKE',
                startJunctionId: dto.startJunctionId,
                endJunctionId: dto.endJunctionId,
                departureTime: new Date(dto.departureTime),
                capacity: dto.capacity ?? 4,
            },
        });
        return { request: req, success: true };
    }

    async getPostedScheduled(userId: string) {
        const schedules = await this.prisma.driverSchedule.findMany({
            where: {
                driverId: userId,
            },
            orderBy: { departureTime: 'asc' },
            take: 10,
        });
        return { schedules }
    }

    /** Performs a smart scan to find pending shared ride requests within a given time window.
     * 
     * Ride requests are typically created by passengers via:
     * - `/passengers/ride-requests` endpoint (passenger app)
     *
     * Workflow:
     * 1. Determines the current time (`now`) and calculates the `windowEnd` time by adding
     *    the specified `windowMinutes`.
     * 2. Queries `rideRequest` records with the following conditions:
     *    - `vehicleType` must be "KEKE".
     *    - `rideType` must be "SHARED".
     *    - `status` must be "PENDING".
     *    - `scheduledFor` must fall between `now` and `windowEnd`.
     *    - If a `startJunctionId` is provided (not `"all"`), filter by that junction.
     *    - If an `endJunctionId` is provided (not `"all"`), filter by that junction.
     *
     * Returns:
     * - `requests`: List of ride requests that meet the scan criteria.
     *
     * Errors:
     * - None explicitly thrown in this method, but empty results are possible if no
     *   matching requests exist within the scan window.
     *
     * @param startJunctionId The identifier of the starting junction. Use `"all"` to ignore this filter.
     * @param endJunctionId   The identifier of the ending junction. Use `"all"` to ignore this filter.
     * @param windowMinutes   The number of minutes ahead from `now` to scan for pending requests.
     * @returns An object containing the list of matching ride requests.
     */
    async smartScan(startJunctionId: string, endJunctionId: string, windowMinutes: number) {
        const now = new Date();
        const windowEnd = new Date(now.getTime() + windowMinutes * 60000);

        const requests = await this.prisma.rideRequest.findMany({
            where: {
                vehicleType: "KEKE",
                rideType: "SHARED",
                status: "PENDING",
                // scheduledFor: { ℹ️ REMINDER FOR ME: "RETURN THIS BACK IN POST PRODUCTION"
                //     gte: now,
                //     lte: windowEnd,
                // },
                ...(startJunctionId !== "all" ? { startJunctionId } : {}),
                ...(endJunctionId !== "all" ? { endJunctionId } : {}),
            },
        });

        return { requests };
    }

}




function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
    const toRad = (n: number) => (n * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}