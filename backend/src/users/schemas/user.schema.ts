import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true, minlength: 3, maxlength: 32 })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, select: false })
  passwordHash?: string;

  @Prop({ type: String, default: null, select: false })
  resetPasswordToken?: string | null;

  @Prop({ type: Date, default: null, select: false })
  resetPasswordExpires?: Date | null;

  @Prop({ type: Boolean, default: false })
  isVerified: boolean;

  @Prop({ type: String, default: null, select: false })
  verificationToken?: string | null;

  @Prop({ type: String, default: null, index: true })
  googleId?: string | null;

  @Prop({ default: 0 })
  reputationScore: number;

  @Prop({ default: 0 })
  totalReputation: number;

  @Prop({ default: 0 })
  reputationXp: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ default: 0 })
  walletBalance: number;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
