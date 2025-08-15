import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common"
import { RoutesService } from "./routes.service"
import { Roles } from "../common/decorators/roles.decorator"
import { RolesGuard } from "../common/guards/roles.guard"
import { UserRole, type VehicleType } from "@prisma/client"
import { Public } from "../auth/decorators/public.decorator"

@Controller("routes")
@UseGuards(RolesGuard)
export class RoutesController {
  constructor(private routesService: RoutesService) {}

  @Public()
  @Get()
  async getAllRoutes(vehicleType?: VehicleType) {
    return this.routesService.getAllRoutes(vehicleType)
  }

  @Public()
  @Get("popular")
  async getPopularRoutes(limit = 10) {
    return this.routesService.getPopularRoutes(+limit)
  }

  @Public()
  @Get(':id')
  async getRouteById(@Param('id') id: string) {
    return this.routesService.getRouteById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createRoute(@Body() routeData: {
    startLocation: string;
    endLocation: string;
    type: VehicleType;
    basePrice: number;
    distance?: number;
    estimatedTime?: number;
  }) {
    return this.routesService.createRoute(routeData);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  async updateRoute(
    @Param('id') id: string,
    @Body() updateData: {
      startLocation?: string;
      endLocation?: string;
      basePrice?: number;
      distance?: number;
      estimatedTime?: number;
      isActive?: boolean;
    },
  ) {
    return this.routesService.updateRoute(id, updateData)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteRoute(@Param('id') id: string) {
    return this.routesService.deleteRoute(id);
  }
}
