import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Realm, RealmSchema } from './schemas/realm.schema';
import { Transaction, TransactionSchema } from '../payments/schemas/transaction.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { RealmsService } from './realms.service';
import { RealmsController } from './realms.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Realm.name, schema: RealmSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RealmsController],
  providers: [RealmsService],
  exports: [RealmsService, MongooseModule],
})
export class RealmsModule {}
