// wallet.controller.ts
import { Controller, Post, Body, Param, Get, Query } from "@nestjs/common"
import { WalletService } from "./wallet.service"
import { Decimal } from "@prisma/client/runtime/library"

@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post(":userId/credit")
  async creditWallet(
    @Param("userId") userId: string,
    @Body("amount") amount: number,
    @Body("description") description: string,
    @Body("reference") reference?: string,
  ) {
    return this.walletService.creditWallet(
      userId,
      new Decimal(amount),
      description,
      reference,
    )
  }

  @Post(":userId/debit")
  async debitWallet(
    @Param("userId") userId: string,
    @Body("amount") amount: number,
    @Body("description") description: string,
    @Body("reference") reference?: string,
  ) {
    return this.walletService.debitWallet(
      userId,
      new Decimal(amount),
      description,
      reference,
    )
  }

  @Post(":userId/tokens")
  async awardTokens(
    @Param("userId") userId: string,
    @Body("tokens") tokens: number,
    @Body("description") description: string,
  ) {
    return this.walletService.awardTokens(userId, tokens, description)
  }

  @Post(":driverId/cashout")
  async requestCashout(
    @Param("driverId") driverId: string,
    @Body("amount") amount: number,
  ) {
    return this.walletService.requestCashout(driverId, new Decimal(amount))
  }

  @Get(":userId/balance")
  async getWalletBalance(@Param("userId") userId: string) {
    return this.walletService.getWalletBalance(userId)
  }

  @Get(":userId/transactions")
  async getTransactionHistory(
    @Param("userId") userId: string,
    @Query("limit") limit?: number,
  ) {
    return this.walletService.getTransactionHistory(userId, limit ? Number(limit) : 50)
  }
}