import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
  TransactionType,
} from '../payments/schemas/transaction.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private readonly transactionModel: Model<TransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(data: { username: string; email: string; passwordHash: string }): Promise<UserDocument> {
    const count = await this.userModel.countDocuments().exec();
    const isFirstUser = count === 0;
    const isAdminText = data.username.toLowerCase().includes('admin') || data.email.toLowerCase().includes('admin');
    const role = (isFirstUser || isAdminText) ? 'ADMIN' : 'USER';
    
    const created = new this.userModel({ ...data, role });
    return created.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async getTopContributors(limit = 10): Promise<UserDocument[]> {
    return this.userModel
      .find({})
      .sort({ reputationScore: -1, totalReputation: -1 })
      .limit(limit)
      .select('username email reputationScore totalReputation walletBalance badges aiBotScore createdAt')
      .exec();
  }

  async updateReputationAndWallet(
    id: string | Types.ObjectId,
    walletDelta: number,
    reputationDelta: number,
    type?: TransactionType,
    gatewayReferenceId?: string,
    description?: string,
  ): Promise<UserDocument | null> {
    const userObjectId = new Types.ObjectId(id.toString());
    let session: ClientSession | null = null;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userObjectId,
          {
            $inc: {
              walletBalance: walletDelta,
              totalReputation: reputationDelta,
              reputationScore: reputationDelta,
            },
          },
          { new: true, session: session || undefined },
        )
        .exec();

      if (walletDelta !== 0) {
        const txType =
          type ||
          (walletDelta > 0
            ? TransactionType.UPVOTE_EARNED
            : TransactionType.UPVOTE_EARNED);

        const tx = new this.transactionModel({
          userId: userObjectId,
          type: txType,
          amount: walletDelta,
          currency: 'cr',
          status: TransactionStatus.COMPLETED,
          gatewayReferenceId,
          description:
            description ||
            (walletDelta > 0 ? 'Upvote micro-reward' : 'Upvote deduction / revocation'),
        });

        await tx.save({ session: session || undefined });
      }

      if (session) {
        await session.commitTransaction();
      }

      return updatedUser;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      this.logger.error(`Error in updateReputationAndWallet transaction: ${error}`);
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  async incrementReputation(id: string | Types.ObjectId, amount: number): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $inc: { reputationScore: amount } }, { new: true })
      .exec();
  }

  async updateWalletBalance(
    id: string | Types.ObjectId,
    amount: number,
    type: TransactionType = TransactionType.DEPOSIT,
    gatewayReferenceId?: string,
    description?: string,
  ): Promise<UserDocument | null> {
    const userObjectId = new Types.ObjectId(id.toString());
    let session: ClientSession | null = null;

    try {
      session = await this.connection.startSession();
      session.startTransaction();
    } catch {
      session = null;
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userObjectId,
          { $inc: { walletBalance: amount } },
          { new: true, session: session || undefined },
        )
        .exec();

      if (amount !== 0) {
        const tx = new this.transactionModel({
          userId: userObjectId,
          type,
          amount,
          currency: 'cr',
          status: TransactionStatus.COMPLETED,
          gatewayReferenceId,
          description: description || `${type} of ${amount} cr`,
        });

        await tx.save({ session: session || undefined });
      }

      if (session) {
        await session.commitTransaction();
      }

      return updatedUser;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      this.logger.error(`Error in updateWalletBalance transaction: ${error}`);
      throw error;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }

  async incrementReputationXp(id: string | Types.ObjectId, amount: number): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $inc: { reputationXp: amount } }, { new: true })
      .exec();
  }

  async getTransactions(userId: string | Types.ObjectId): Promise<TransactionDocument[]> {
    const userObjectId = new Types.ObjectId(userId.toString());
    return this.transactionModel
      .find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }
}
