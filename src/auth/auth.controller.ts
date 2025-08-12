import { Controller, Post } from "@nestjs/common"
import type { AuthService } from "./auth.service"
import { Public } from "./decorators/public.decorator"

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  async register(registerDto: {
    firstName: string
    lastName: string
    phone?: string
    email?: string
  }) {
    return this.authService.registerPassenger(registerDto)
  }

  @Public()
  @Post("login")
  async login(loginDto: { identifier: string }) {
    return this.authService.loginWithOtp(loginDto.identifier)
  }

  @Public()
  @Post("verify-otp")
  async verifyOtp(verifyDto: {
    userId: string
    code: string
    type: string
  }) {
    return this.authService.verifyOtp(verifyDto.userId, verifyDto.code, verifyDto.type)
  }

  @Public()
  @Post("admin/login")
  async adminLogin(loginDto: {
    email: string
    password: string
  }) {
    return this.authService.adminLogin(loginDto.email, loginDto.password)
  }
}
