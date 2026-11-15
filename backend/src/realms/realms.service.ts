import { Injectable, HttpException, HttpStatus, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Realm, RealmDocument } from './schemas/realm.schema';
import { Transaction, TransactionDocument } from '../payments/schemas/transaction.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateRealmDto } from './dto/create-realm.dto';
import { TransactionStatus } from '../payments/schemas/transaction.schema';

const REALM_MINT_FEE = 5000;

@Injectable()
export class RealmsService {
  constructor(
    @InjectModel(Realm.name) private realmModel: Model<RealmDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async create(userId: string, dto: CreateRealmDto): Promise<RealmDocument> {
    // Sanitise name
    const safeName = dto.name.toLowerCase().replace(/\s+/g, '_');

    // Check uniqueness before opening transaction for fast fail
    const existing = await this.realmModel.findOne({ name: safeName }).lean();
    if (existing) throw new ConflictException(`Realm "n/${safeName}" already exists`);

    const session = await this.connection.startSession();
    try {
      let realm: RealmDocument;
      await session.withTransaction(async () => {
        // 1. Load user and check balance
        const user = await this.userModel.findById(userId).session(session);
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        if (user.walletBalance < REALM_MINT_FEE) {
          throw new HttpException(
            `Insufficient balance. Minting a Realm requires ${REALM_MINT_FEE} cr.`,
            HttpStatus.PAYMENT_REQUIRED,
          );
        }

        // 2. Deduct fee
        user.walletBalance -= REALM_MINT_FEE;
        await user.save({ session });

        // 3. Create transaction ledger entry
        await this.transactionModel.create(
          [
            {
              userId: user._id,
              type: 'REALM_MINT_FEE',
              amount: -REALM_MINT_FEE,
              currency: 'cr',
              status: TransactionStatus.COMPLETED,
              description: `Minted Realm: n/${safeName}`,
              metadata: { realmName: safeName },
            },
          ],
          { session },
        );

        // 4. Create Realm
        const created = await this.realmModel.create(
          [
            {
              name: safeName,
              displayName: dto.displayName,
              description: dto.description || '',
              ownerId: user._id,
              themeColor: dto.themeColor || 'rose',
            },
          ],
          { session },
        );
        realm = created[0];
      });
      return realm!;
    } finally {
      await session.endSession();
    }
  }

  async findByName(name: string): Promise<RealmDocument> {
    const realm = await this.realmModel
      .findOne({ name: name.toLowerCase() })
      .populate('ownerId', 'username _id')
      .lean();
    if (!realm) throw new NotFoundException(`Realm "n/${name}" not found`);
    return realm as unknown as RealmDocument;
  }

  async findAll(): Promise<RealmDocument[]> {
    return this.realmModel.find().sort({ memberCount: -1, createdAt: -1 }).lean().exec() as unknown as RealmDocument[];
  }

  async update(realmName: string, userId: string, patch: Partial<Pick<Realm, 'description' | 'themeColor' | 'displayName'>>): Promise<RealmDocument> {
    const realm = await this.realmModel.findOne({ name: realmName.toLowerCase() });
    if (!realm) throw new NotFoundException(`Realm not found`);
    if (realm.ownerId.toString() !== userId) throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    Object.assign(realm, patch);
    await realm.save();
    return realm;
  }
}
