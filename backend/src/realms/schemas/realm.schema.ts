import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RealmDocument = Realm & Document;

@Schema({ timestamps: true })
export class Realm {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]+$/ })
  name: string;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 60 })
  displayName: string;

  @Prop({ trim: true, maxlength: 500, default: '' })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ default: 1 })
  memberCount: number;

  @Prop({ type: String, default: 'rose' })
  themeColor: string;

  createdAt: Date;
  updatedAt: Date;
}

export const RealmSchema = SchemaFactory.createForClass(Realm);
