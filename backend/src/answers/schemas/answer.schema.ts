import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnswerDocument = Answer & Document;

@Schema({ timestamps: true })
export class Answer {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;

  @Prop({ required: false, trim: true })
  text?: string;

  @Prop({ required: false })
  audioNoteUrl?: string;

  @Prop({ type: [String], default: [] })
  mediaUrls: string[];

  @Prop({ default: false })
  isAccepted: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  upvotes: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  downvotes: Types.ObjectId[];

  @Prop({ default: 0 })
  voteScore: number;

  @Prop({ type: String, enum: ['approved', 'quarantined'], default: 'approved', index: true })
  status: string;

  @Prop({ default: 0 })
  aiBotScore: number;

  createdAt: Date;
  updatedAt: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);

AnswerSchema.index({ postId: 1, createdAt: -1 });
