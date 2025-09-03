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

  //Driver & Passenger Auth Process
  async loginWithOtp_old(identifier: string, role: UserRole) {
    let user = await this.prisma.user.findFirst({
      where: { phone: identifier, role, isActive: true },
    });

    if (!user) {
      if (role === UserRole.DRIVER) {
        throw new UnauthorizedException("Driver account not found. Contact the company.");
      }
      // passengers get auto-temp account
      user = await this.prisma.user.create({
        data: {
          phone: identifier,
          firstName: "TEMP",
          lastName: "TEMP",
          role: UserRole.PASSENGER,
          isActive: false,
        },
      });
    }

    await this.otpService.generateAndSendOtp(user.id, "login");
    return { message: "OTP sent successfully", userId: user.id };
  }

  async loginWithOtp(identifier: string, role: UserRole) {
    // Step 1: Find the user
    let user = await this.prisma.user.findFirst({
      where: { phone: identifier, role },
    });

    if (!user) {
      if (role === UserRole.DRIVER) {
        throw new UnauthorizedException("Driver account not found. Contact the company.");
      }

      // Passenger: create a temporary account
      user = await this.prisma.user.create({
        data: {
          phone: identifier,
          firstName: "TEMP",
          lastName: "TEMP",
          role: UserRole.PASSENGER,
          isActive: false,
        },
      });
    }

    // Step 2: Check for an existing valid OTP
    const now = new Date();
    const existingOtp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        type: "login",
        isUsed: false,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    if (existingOtp) {
      // Calculate time left in seconds
      const timeLeft = Math.floor((existingOtp.expiresAt.getTime() - now.getTime()) / 1000);
      return {
        message: "OTP already sent",
        userId: user.id,
        expiresIn: timeLeft,
      };
    }

    // Step 3: Generate a new OTP
    await this.otpService.generateAndSendOtp(user.id, "login");

    // Step 4: Fetch the OTP we just generated to get expiresAt
    const newOtp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, type: "login", isUsed: false },
      orderBy: { expiresAt: "desc" },
    });

    const timeLeft = newOtp ? Math.floor((newOtp.expiresAt.getTime() - now.getTime()) / 1000) : 600;

    return {
      message: "OTP sent successfully",
      userId: user.id,
      expiresIn: timeLeft,
    };
  }

  async verifyOtp(userId: string, code: string, type: string) {
    const isValid = await this.otpService.verifyOtp(userId, code, type)
    if (!isValid) throw new UnauthorizedException("Invalid or expired OTP");

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        passengerProfile: true,
        driverProfile: true,
      },
    })
    // const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException("User not found");

    // If it's a temporary user, prompt for profile completion
    if (!user.firstName || user.firstName === "TEMP") {
      return { requiresProfileCompletion: true, userId: user.id };
    }

    // Otherwise, grant session
    const payload = { sub: user.id, role: user.role, phone: user.phone };
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

  async completeProfile(dto: { userId: string; firstName: string; lastName: string }) {
    // Step 1: fetch the user with profile
    const existing = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      include: { passengerProfile: true, driverProfile: true },
    });

    if (!existing) throw new UnauthorizedException("User not found");

    // Step 2: update safely
    const user = await this.prisma.user.update({
      where: { id: dto.userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        isActive: true,
        passengerProfile: existing.passengerProfile ? undefined : { create: {} },
      },
      include: { passengerProfile: true, driverProfile: true },
    });

    // Step 3: return consistent response
    const payload = { sub: user.id, role: user.role, phone: user.phone };
    return {
      access_token: this.jwtService.sign(payload),
      message: "Profile completed",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.passengerProfile || user.driverProfile,
      },
    };
  }


  //Admin Auth Process
  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findFirst({
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










// async registerPassenger(data: {
//   firstName: string
//   lastName: string
//   phone?: string
//   email?: string
// }) {
//   if (!data.phone && !data.email) {
//     throw new BadRequestException("Phone or email is required")
//   }

//   const existingUser = await this.prisma.user.findFirst({
//     where: {
//       OR: [{ phone: data.phone }, { email: data.email }],
//     },
//   })

//   if (existingUser) {
//     throw new BadRequestException("User already exists")
//   }

//   const user = await this.prisma.user.create({
//     data: {
//       firstName: data.firstName,
//       lastName: data.lastName,
//       phone: data.phone,
//       email: data.email,
//       role: UserRole.PASSENGER,
//       passengerProfile: {
//         create: {},
//       },
//     },
//     include: {
//       passengerProfile: true,
//     },
//   })

//   // Send OTP
//   await this.otpService.generateAndSendOtp(user.id, "registration")

//   return {
//     message: "Registration successful. OTP sent.",
//     userId: user.id,
//   }
// }