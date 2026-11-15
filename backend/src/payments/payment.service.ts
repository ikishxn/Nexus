import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, ClientSession } from 'mongoose';
import * as crypto from 'crypto';
import Stripe from 'stripe';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from './schemas/transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';

/**
 * Stripe SDK Webhook helper for cryptographic HMAC-SHA256 signature verification.
 */
export const stripe = {
  webhooks: {
    constructEvent(
      payload: Buffer | string,
      signatureHeader: string,
      secret: string,
      toleranceSeconds: number = 300,
    ): any {
      if (!secret) {
        throw new Error('Stripe webhook secret is not configured');
      }

      if (!signatureHeader) {
        throw new Error('No stripe-signature header value was provided');
      }

      const parts = signatureHeader.split(',');
      const timestamp = parts.find((p) => p.startsWith('t='))?.replace('t=', '');
      const signatures = parts
        .filter((p) => p.startsWith('v1='))
        .map((p) => p.replace('v1=', ''));

      if (!timestamp || signatures.length === 0) {
        throw new Error('Unable to extract timestamp and signatures from header');
      }

      // Check timestamp tolerance
      const timestampNum = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      if (toleranceSeconds > 0 && Math.abs(now - timestampNum) > toleranceSeconds) {
        throw new Error('Timestamp outside the tolerance zone');
      }

      const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
      const signedPayload = `${timestamp}.${payloadString}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      const isValid = signatures.some((sig) => {
        try {
          return crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(sig, 'hex'),
          );
        } catch {
          return false;
        }
      });

      if (!isValid) {
        throw new Error('No signatures found matching the expected signature for payload');
      }

      return JSON.parse(payloadString);
    },
  },
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripeClient: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {
    const stripeKey =
      process.env.STRIPE_SECRET_KEY ||
      this.configService.get<string>('STRIPE_SECRET_KEY');

    if (stripeKey) {
      const StripeConstructor = (Stripe as any)?.default || Stripe;
      this.stripeClient = new StripeConstructor(stripeKey);
      this.logger.log('Stripe client initialized successfully using STRIPE_SECRET_KEY.');
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not defined in environment variables. Live Stripe checkout will fall back to mock checkout session.',
      );
    }
  }

  /**
   * Processes a webhook payload from Stripe/payment gateway with cryptographic verification.
   */
  async processWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ received: boolean; status?: string; txId?: string }> {
    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ||
      this.configService.get<string>('WEBHOOK_SECRET');

    let event: any;

    if (webhookSecret) {
      try {
        if (this.stripeClient) {
          event = this.stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
        } else {
          event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        }
        this.logger.log(`Cryptographic signature verified for event: ${event.type}`);
      } catch (err: any) {
        this.logger.error(`Webhook signature verification failed: ${err.message}`);
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
    } else {
      this.logger.warn(
        'WEBHOOK_SECRET not defined in environment variables. Parsing raw body in local dev mode.',
      );
      try {
        event = JSON.parse(rawBody.toString('utf8'));
      } catch (err) {
        throw new BadRequestException('Invalid JSON payload in raw body');
      }
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const sessionObj = event.data?.object || {};
        const metadata = sessionObj.metadata || {};

        const userId = metadata.userId || sessionObj.client_reference_id;
        const creditAmount = Number(
          metadata.creditAmount || metadata.credits || (sessionObj.amount_total ? (sessionObj.amount_total / 100) * 100 : 0),
        );

        if (!userId || !creditAmount) {
          this.logger.warn(`Missing userId (${userId}) or creditAmount (${creditAmount}) in session metadata`);
          throw new BadRequestException('userId or creditAmount missing in session metadata');
        }

        const gatewayReferenceId = event.id || sessionObj.id || `gw_${Date.now()}`;

        // Idempotency: verify this event has not already been recorded
        const existing = await this.transactionModel.findOne({ gatewayReferenceId }).exec();
        if (existing) {
          this.logger.log(`Event ${gatewayReferenceId} already recorded. Idempotency preserved.`);
          return { received: true, status: 'already_processed' };
        }

        // Open Mongoose Client Session
        let session: ClientSession | null = null;
        try {
          session = await this.connection.startSession();
          session.startTransaction();
        } catch {
          session = null;
        }

        try {
          // 1. Create Transaction document (type: 'DEPOSIT', status: 'COMPLETED')
          const tx = new this.transactionModel({
            userId: new Types.ObjectId(userId),
            type: TransactionType.DEPOSIT,
            amount: creditAmount,
            currency: 'cr',
            status: TransactionStatus.COMPLETED,
            gatewayReferenceId,
            description: `Credit purchase (${creditAmount.toLocaleString()} cr via Stripe Checkout)`,
            metadata: {
              stripeSessionId: sessionObj.id,
              amountTotal: sessionObj.amount_total,
              currency: sessionObj.currency,
            },
          });
          await tx.save({ session: session || undefined });

          // 2. Execute $inc on User's walletBalance by the purchased amount
          const updatedUser = await this.userModel.findByIdAndUpdate(
            new Types.ObjectId(userId),
            { $inc: { walletBalance: creditAmount } },
            { session: session || undefined, new: true },
          );

          if (!updatedUser) {
            throw new NotFoundException(`User ${userId} not found during wallet deposit`);
          }

          // 3. Commit the transaction
          if (session) {
            await session.commitTransaction();
          }
          this.logger.log(
            `Successfully credited ${creditAmount} cr to user ${userId} via gateway ref ${gatewayReferenceId}`,
          );

          return { received: true, txId: tx._id.toString() };
        } catch (error) {
          if (session) {
            await session.abortTransaction();
          }
          this.logger.error(`Transaction aborted during checkout deposit: ${error}`);
          throw error;
        } finally {
          if (session) {
            await session.endSession();
          }
        }
      }

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return { received: true };
    }
  }

  /**
   * Generates a checkout session for purchasing credits via Stripe Checkout.
   */
  async createCheckoutSession(
    userId: string,
    amount: number,
  ): Promise<{ url: string; checkoutUrl: string; referenceId: string; amountUsd: number }> {
    const rawAmount = Number(amount || 500);
    // If rawAmount is in dollars (e.g. 5 for $5.00), convert to credits (500)
    // If rawAmount is in credits (>= 100, e.g. 500 cr for $5.00), keep credits
    const credits = rawAmount >= 100 ? rawAmount : Math.round(rawAmount * 100);
    if (credits < 100) {
      throw new BadRequestException('Minimum purchase is 100 credits ($1.00 USD)');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1 credit = 1 cent ($0.01), so 500 cr = 500 cents = $5.00
    // If rawAmount was dollars (e.g. 5), unit_amount is rawAmount * 100 = 500 cents
    const unitAmountCents = rawAmount >= 100 ? Math.round(rawAmount) : Math.round(rawAmount * 100);
    const amountUsd = Number((unitAmountCents / 100).toFixed(2));

    const frontendUrl = (
      process.env.FRONTEND_URL ||
      this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('CORS_ORIGIN') ||
      'http://localhost:5173'
    ).replace(/\/$/, '');

    const success_url = `${frontendUrl}/wallet?success=true`;
    const cancel_url = `${frontendUrl}/wallet?canceled=true`;

    if (!this.stripeClient) {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not configured. Falling back to mock checkout session.',
      );
      const referenceId = `mock_cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const mockUrl = `https://checkout.stripe.com/pay/mock_session_${referenceId}`;
      return {
        url: mockUrl,
        checkoutUrl: mockUrl,
        referenceId,
        amountUsd,
      };
    }

    try {
      const baseSessionParams: any = {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: unitAmountCents,
              product_data: {
                name: 'Nexus Credits',
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: userId.toString(),
          creditAmount: credits.toString(),
          credits: credits.toString(),
          amount: credits.toString(),
        },
        client_reference_id: userId.toString(),
        success_url,
        cancel_url,
      };

      let session: any;
      try {
        // Attempt with explicit card payment method type
        session = await this.stripeClient.checkout.sessions.create({
          ...baseSessionParams,
          payment_method_types: ['card'],
        });
      } catch (pmError: any) {
        if (
          pmError.message?.includes('payment_method_types') ||
          pmError.code === 'parameter_unknown'
        ) {
          this.logger.warn(
            'Stripe account enforces dynamic payment methods; generating checkout session without payment_method_types parameter.',
          );
          session = await this.stripeClient.checkout.sessions.create(baseSessionParams);
        } else {
          throw pmError;
        }
      }

      return {
        url: session.url || success_url,
        checkoutUrl: session.url || success_url,
        referenceId: session.id,
        amountUsd,
      };
    } catch (err: any) {
      this.logger.error(`Stripe checkout session creation failed: ${err.message}`);
      throw new BadRequestException(`Stripe Error: ${err.message}`);
    }
  }

  /**
   * Instant purchase for testing / sandbox.
   */
  async buyCredits(userId: string, credits: number): Promise<TransactionDocument> {
    if (credits < 100) {
      throw new BadRequestException('Minimum credit purchase is 100 cr');
    }

    const referenceId = `sim_buy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const updated = await this.usersService.updateWalletBalance(
      userId,
      credits,
      TransactionType.DEPOSIT,
      referenceId,
      `Credit Purchase (${credits.toLocaleString()} cr via Checkout)`,
    );

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    const tx = await this.transactionModel.findOne({ gatewayReferenceId: referenceId }).exec();
    return tx!;
  }

  /**
   * Cash out fiat request. Strict validation: minimum 5,000 cr.
   */
  async cashOut(
    userId: string,
    amount: number,
    payoutMethod: string = 'stripe_connect',
    payoutAccount?: string,
  ): Promise<TransactionDocument> {
    if (amount < 5000) {
      throw new BadRequestException('Minimum cash-out threshold is 5,000 cr ($50.00 USD)');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.walletBalance < amount) {
      throw new BadRequestException(`Insufficient wallet balance. You have ${user.walletBalance} cr.`);
    }

    const referenceId = `payout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const description = `Cash-out of ${amount.toLocaleString()} cr ($${(amount / 100).toFixed(2)} USD) via ${payoutMethod}${
      payoutAccount ? ` to ${payoutAccount}` : ''
    }`;

    await this.usersService.updateWalletBalance(
      userId,
      -amount,
      TransactionType.WITHDRAWAL,
      referenceId,
      description,
    );

    const tx = await this.transactionModel.findOne({ gatewayReferenceId: referenceId }).exec();
    return tx!;
  }

  /**
   * Retrieves transaction history for the user from the immutable ledger.
   */
  async getUserHistory(userId: string): Promise<TransactionDocument[]> {
    return this.usersService.getTransactions(userId);
  }
}
