import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { BuyCreditsDto } from './dto/buy-credits.dto';

@Controller(['payments', 'payment'])
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature || !req.rawBody) {
      throw new BadRequestException('Missing signature or body');
    }
    return this.paymentService.processWebhook(req.rawBody, signature);
  }

  /**
   * Generates a checkout session for purchasing credits.
   */
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() buyCreditsDto: BuyCreditsDto,
  ) {
    const amount = Number(buyCreditsDto.amount ?? buyCreditsDto.credits ?? 500);
    return this.paymentService.createCheckoutSession(user.userId, amount);
  }

  /**
   * Purchase credits endpoint: generates checkout session URL for payment gateway.
   */
  @UseGuards(JwtAuthGuard)
  @Post('buy')
  @HttpCode(HttpStatus.OK)
  async buyCredits(
    @CurrentUser() user: AuthenticatedUser,
    @Body() buyCreditsDto: BuyCreditsDto,
  ) {
    const amount = Number(buyCreditsDto.amount ?? buyCreditsDto.credits ?? 500);
    return this.paymentService.createCheckoutSession(user.userId, amount);
  }

  /**
   * Direct simulate buy endpoint for instant sandbox testing without external payment gateway.
   */
  @UseGuards(JwtAuthGuard)
  @Post('simulate-buy')
  @HttpCode(HttpStatus.OK)
  async simulateBuy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() buyCreditsDto: BuyCreditsDto,
  ) {
    const amount = Number(buyCreditsDto.amount ?? buyCreditsDto.credits ?? 500);
    return this.paymentService.buyCredits(user.userId, amount);
  }

  /**
   * Request cash-out to fiat via Stripe Connect / bank payout.
   * Strictly enforces minimum 5,000 cr balance.
   */
  @UseGuards(JwtAuthGuard)
  @Post('cash-out')
  @HttpCode(HttpStatus.OK)
  async cashOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body('amount') amount: number,
    @Body('payoutMethod') payoutMethod?: string,
    @Body('payoutAccount') payoutAccount?: string,
  ) {
    return this.paymentService.cashOut(
      user.userId,
      Number(amount),
      payoutMethod || 'stripe_connect',
      payoutAccount,
    );
  }

  /**
   * Fetches the user's immutable financial ledger history.
   */
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.getUserHistory(user.userId);
  }
}
