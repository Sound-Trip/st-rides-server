import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "../prisma/prisma.service"
import { OtpService } from "./otp.service"
import * as bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) { }

  async registerPassenger(data: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
  }) {
    if (!data.phone && !data.email) {
      throw new BadRequestException("Phone or email is required")
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: data.phone }, { email: data.email }],
      },
    })

    if (existingUser) {
      throw new BadRequestException("User already exists")
    }

    const user = await this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        role: UserRole.PASSENGER,
        passengerProfile: {
          create: {},
        },
      },
      include: {
        passengerProfile: true,
      },
    })

    // Send OTP
    await this.otpService.generateAndSendOtp(user.id, "registration")

    return {
      message: "Registration successful. OTP sent.",
      userId: user.id,
    }
  }

  async loginWithOtp(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: identifier }, { email: identifier }],
        isActive: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    await this.otpService.generateAndSendOtp(user.id, "login")

    return {
      message: "OTP sent successfully",
      userId: user.id,
    }
  }

  async verifyOtp(userId: string, code: string, type: string) {
    const isValid = await this.otpService.verifyOtp(userId, code, type)

    if (!isValid) {
      throw new UnauthorizedException("Invalid or expired OTP")
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        passengerProfile: true,
        driverProfile: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    const payload = {
      sub: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.passengerProfile || user.driverProfile,
      },
    }
  }

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email, isActive: true },
    })

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials")
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    })

    const payload = {
      sub: admin.id,
      role: "ADMIN",
      email: admin.email,
      permissions: admin.permissions,
    }

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
      },
    }
  }

  async validateUser(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        passengerProfile: true,
        driverProfile: true,
      },
    })

    if (!user || !user.isActive) {
      return null
    }

    return user
  }
}
