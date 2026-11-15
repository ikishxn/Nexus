import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BOUNTY_EARNED = 'BOUNTY_EARNED',
  BOUNTY_PAID = 'BOUNTY_PAID',
  UPVOTE_EARNED = 'UPVOTE_EARNED',
  REALM_MINT_FEE = 'REALM_MINT_FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class Transaction {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(TransactionType),
    required: true,
    index: true,
  })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: String, default: 'cr' })
  currency: string;

  @Prop({
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.COMPLETED,
    index: true,
  })
  status: TransactionStatus;

  @Prop({ type: String, sparse: true, unique: true, index: true })
  gatewayReferenceId?: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Object, default: {} })
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ userId: 1, createdAt: -1 });

