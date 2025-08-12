import { Injectable, BadRequestException } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import { TransactionType, TransactionStatus } from "@prisma/client"
import { Decimal } from "@prisma/client/runtime/library"

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async creditWallet(userId: string, amount: Decimal, description: string, reference?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
          description,
          reference,
        },
      })

      // Update user wallet balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          passengerProfile: true,
          driverProfile: true,
        },
      })

      if (user.passengerProfile) {
        await tx.passengerProfile.update({
          where: { userId },
          data: {
            walletBalance: {
              increment: amount,
            },
          },
        })
      } else if (user.driverProfile) {
        await tx.driverProfile.update({
          where: { userId },
          data: {
            walletBalance: {
              increment: amount,
            },
          },
        })
      }

      return transaction
    })
  }

  async debitWallet(userId: string, amount: Decimal, description: string, reference?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Check balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          passengerProfile: true,
          driverProfile: true,
        },
      })

      const currentBalance = user.passengerProfile?.walletBalance || user.driverProfile?.walletBalance || new Decimal(0)

      if (currentBalance.lt(amount)) {
        throw new BadRequestException("Insufficient wallet balance")
      }

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount: amount.neg(),
          type: TransactionType.DEBIT,
          status: TransactionStatus.COMPLETED,
          description,
          reference,
        },
      })

      // Update user wallet balance
      if (user.passengerProfile) {
        await tx.passengerProfile.update({
          where: { userId },
          data: {
            walletBalance: {
              decrement: amount,
            },
          },
        })
      } else if (user.driverProfile) {
        await tx.driverProfile.update({
          where: { userId },
          data: {
            walletBalance: {
              decrement: amount,
            },
          },
        })
      }

      return transaction
    })
  }

  async awardTokens(userId: string, tokens: number, description: string) {
    return this.prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount: new Decimal(tokens),
          type: TransactionType.TOKEN_REWARD,
          status: TransactionStatus.COMPLETED,
          description,
        },
      })

      // Update passenger tokens
      await tx.passengerProfile.update({
        where: { userId },
        data: {
          earnedTokens: {
            increment: tokens,
          },
        },
      })

      return transaction
    })
  }

  async requestCashout(driverId: string, amount: Decimal) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
    })

    if (!driver) {
      throw new BadRequestException("Driver profile not found")
    }

    if (driver.walletBalance.lt(amount)) {
      throw new BadRequestException("Insufficient balance for cashout")
    }

    return this.prisma.$transaction(async (tx) => {
      // Create pending transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: driverId,
          amount: amount.neg(),
          type: TransactionType.CASHOUT,
          status: TransactionStatus.PENDING,
          description: "Cashout request",
        },
      })

      // Deduct from wallet balance
      await tx.driverProfile.update({
        where: { userId: driverId },
        data: {
          walletBalance: {
            decrement: amount,
          },
        },
      })

      return transaction
    })
  }

  async getWalletBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        passengerProfile: true,
        driverProfile: true,
      },
    })

    const balance = user.passengerProfile?.walletBalance || user.driverProfile?.walletBalance || new Decimal(0)
    const tokens = user.passengerProfile?.earnedTokens || 0

    return {
      balance,
      tokens,
    }
  }

  async getTransactionHistory(userId: string, limit = 50) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
}
