import { Controller, Post, Body } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { Public } from "./decorators/public.decorator"
import { AdminLoginDto, LoginDto, RegisterDto, VerifyOtpDto } from "./dto/auth.dto"

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithOtp(loginDto.identifier, loginDto.role)
  }

  @Public()
  @Post("register")
  async completeProfile(@Body() registerDto: RegisterDto) {
    return this.authService.completeProfile(registerDto);
  }

  @Public()
  @Post("verify-otp")
  async verifyOtp(@Body() verifyDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyDto.userId, verifyDto.code, verifyDto.type)
  }

  @Public()
  @Post("admin/login")
  async adminLogin(@Body() loginDto: AdminLoginDto) {
    return this.authService.adminLogin(loginDto.email, loginDto.password)
  }
}
