import { Controller, Get, Post, Put, Body, Param, UseGuards } from "@nestjs/common"
import { AdminService } from "./admin.service"
import { Roles } from "../common/decorators/roles.decorator"
import { RolesGuard } from "../common/guards/roles.guard"
import { CurrentUser } from "../common/decorators/current-user.decorator"
import { UserRole, type MaintenanceStatus, type VehicleType } from "@prisma/client"

@Controller("admin")
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.adminService.getDashboardStats()
  }

  @Get("users")
  async getAllUsers(page: number, limit: number, role?: UserRole) {
    return this.adminService.getAllUsers(page, limit, role)
  }

  @Post('drivers')
  async createDriver(@Body() driverData: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    vehicleType: VehicleType;
    vehicleModel: string;
    plateNumber: string;
    licenseNumber: string;
    assignedRouteId?: string;
    isCompanyVehicle?: boolean;
  }) {
    return this.adminService.createDriver(driverData);
  }

  @Put("users/:id/ban")
  async banUser(@Param('id') userId: string, @Body() banData: { reason?: string }) {
    return this.adminService.banUser(userId, banData.reason)
  }

  @Put('users/:id/unban')
  async unbanUser(@Param('id') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  @Get("rides")
  async getAllRides(page: number, limit: number, status?: string) {
    return this.adminService.getAllRides(page, limit, status)
  }

  @Get("maintenance")
  async getMaintenanceRequests(status?: MaintenanceStatus) {
    return this.adminService.getMaintenanceRequests(status)
  }

  @Put("maintenance/:id/approve")
  async approveMaintenanceRequest(@Param('id') requestId: string, @CurrentUser() admin: any) {
    return this.adminService.approveMaintenanceRequest(requestId, admin.id)
  }

  @Put('config/commission')
  async setCommissionRate(@Body() configData: { rate: number }) {
    return this.adminService.setCommissionRate(configData.rate);
  }

  @Get("config")
  async getSystemConfig() {
    return this.adminService.getSystemConfig()
  }

  @Get("transactions")
  async getWalletTransactions(page: number, limit: number, userId?: string) {
    return this.adminService.getWalletTransactions(page, limit, userId)
  }
}
