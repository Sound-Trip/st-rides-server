import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generateAndSendOtp(userId: string, type: string): Promise<void> {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save OTP to database
    await this.prisma.otpCode.create({
      data: {
        userId,
        code,
        type,
        expiresAt,
      },
    })

    // Get user details for sending OTP
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    // Send OTP via SMS or Email (implement with your preferred service)
    if (user?.phone) {
      await this.sendSmsOtp(user?.phone, code)
    } else if (user?.email) {
      await this.sendEmailOtp(user.email, code)
    }
  }

  async verifyOtp(userId: string, code: string, type: string): Promise<boolean> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        type,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!otpRecord) {
      return false
    }

    // Mark OTP as used
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    })

    return true
  }

  private async sendSmsOtp(phone: string, code: string): Promise<void> {
    // Implement SMS sending with Termii, Twilio, etc.
    console.log(`Sending SMS OTP ${code} to ${phone}`)

    // Example with Termii (uncomment and configure)
    /*
    const termiiApiKey = this.configService.get<string>('TERMII_API_KEY');
    const response = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        from: 'RideApp',
        sms: `Your OTP code is: ${code}`,
        type: 'plain',
        api_key: termiiApiKey,
        channel: 'generic',
      }),
    });
    */
  }

  private async sendEmailOtp(email: string, code: string): Promise<void> {
    // Implement email sending
    console.log(`Sending Email OTP ${code} to ${email}`)

    // Example implementation with nodemailer or your preferred service
  }
}
