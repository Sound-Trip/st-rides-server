import { Injectable, Logger } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class DeviceTokensService {
  private logger = new Logger("DeviceTokensService")
  private deviceTokenCache: Map<string, Set<string>> = new Map() // userId -> Set of tokens

  constructor(private prisma: PrismaService) { }

  async registerDeviceToken(userId: string, token: string, deviceType: string) {
    try {
      // Store in memory cache for quick access
      if (!this.deviceTokenCache.has(userId)) {
        this.deviceTokenCache.set(userId, new Set())
      }

      let tokenSet = this.deviceTokenCache.get(userId)
      if (!tokenSet) {
        tokenSet = new Set<string>()
        this.deviceTokenCache.set(userId, tokenSet)
      }
      tokenSet.add(token)

      // Also store in database using SystemConfig as a workaround
      const key = `device_tokens:${userId}`
      const existing = await this.prisma.systemConfig.findUnique({ where: { key } })

      let tokens: string[] = []
      if (existing) {
        tokens = JSON.parse(existing.value)
      }

      if (!tokens.includes(token)) {
        tokens.push(token)
        await this.prisma.systemConfig.upsert({
          where: { key },
          update: { value: JSON.stringify(tokens) },
          create: { key, value: JSON.stringify(tokens) },
        })
      }

      this.logger.log(`Device token registered for user ${userId}`)
      return { userId, token, deviceType }
    } catch (error) {
      this.logger.error("Failed to register device token:", error)
      throw error
    }
  }

  async unregisterDeviceToken(userId: string, token: string) {
    try {
      const tokens = this.deviceTokenCache.get(userId)
      if (tokens) {
        tokens.delete(token)
      }

      const key = `device_tokens:${userId}`
      const existing = await this.prisma.systemConfig.findUnique({ where: { key } })

      if (existing) {
        let storedTokens: string[] = JSON.parse(existing.value)
        storedTokens = storedTokens.filter((t) => t !== token)

        if (storedTokens.length === 0) {
          await this.prisma.systemConfig.delete({ where: { key } })
        } else {
          await this.prisma.systemConfig.update({
            where: { key },
            data: { value: JSON.stringify(storedTokens) },
          })
        }
      }

      this.logger.log(`Device token unregistered for user ${userId}`)
      return { success: true }
    } catch (error) {
      this.logger.error("Failed to unregister device token:", error)
      throw error
    }
  }

  async getDeviceTokens(userId: string): Promise<string[]> {
    try {
      // Check cache first
      if (this.deviceTokenCache.has(userId)) {
        const tokenSet = this.deviceTokenCache.get(userId)!
        return Array.from(tokenSet)
      }

      // Load from database
      const key = `device_tokens:${userId}`
      const existing = await this.prisma.systemConfig.findUnique({ where: { key } })

      let tokens: string[] = []
      if (existing) {
        tokens = JSON.parse(existing.value)
        this.deviceTokenCache.set(userId, new Set(tokens))
      }

      return tokens
    } catch (error) {
      this.logger.error("Failed to get device tokens:", error)
      return []
    }
  }

  async getUserDeviceTokens(userId: string) {
    try {
      const tokens = await this.getDeviceTokens(userId)
      return tokens.map((token) => ({ token, userId }))
    } catch (error) {
      this.logger.error("Failed to get user device tokens:", error)
      throw error
    }
  }
}
