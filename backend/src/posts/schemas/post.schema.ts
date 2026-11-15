import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

export enum PostCategory {
  TECHNOLOGY = 'technology',
  MOVIES = 'movies',
  FOOD_COOKING = 'food_cooking',
  FASHION_STYLE = 'fashion_style',
  SCIENCE = 'science',
  MUSIC = 'music',
  BOOKS = 'books',
  BUSINESS = 'business',
  PSYCHOLOGY = 'psychology',
  HISTORY = 'history',
  HEALTH = 'health',
  GENERAL = 'general',
}

export enum PostType {
  POST = 'post',
  QUESTION = 'question',
  DEBATE = 'debate',
}

@Schema({ _id: false })
export class ContentPayload {
  @Prop({ required: false, trim: true })
  text?: string;

  @Prop({ required: false, trim: true })
  codeSnippet?: string;

  @Prop({ type: [String], default: [] })
  mediaUrls?: string[];
}

@Schema({ timestamps: true })
export class Post {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 150 })
  title: string;

  @Prop({ type: ContentPayload, required: true })
  content: ContentPayload;

  @Prop({ type: String, enum: PostCategory, required: true, index: true })
  category: PostCategory;

  @Prop({ type: String, enum: PostType, default: PostType.POST, index: true })
  postType: PostType;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  voteScore: number;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  upvotedBy: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  upvotes: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  downvotes: Types.ObjectId[];

  @Prop({ default: 0 })
  bountyAmount: number;

  @Prop({ type: String, enum: ['none', 'active', 'awarded'], default: 'none', index: true })
  bountyStatus: string;

  @Prop({ default: false })
  bountyClaimed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  targetedExpertId: Types.ObjectId | null;

  @Prop({ type: Date, default: null, index: true })
  exclusiveUntil: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Answer', default: null })
  acceptedAnswer: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  acceptedCommentId: Types.ObjectId | null;

  @Prop({ type: String, enum: ['approved', 'pending', 'rejected', 'quarantined', 'deleted'], default: 'approved', index: true })
  status: string;

  @Prop({ default: 0 })
  aiBotScore: number;

  @Prop({ type: String, required: false })
  stance?: string;

  @Prop({ type: String, required: false })
  threadStyle?: string;

  @Prop({ default: 0 })
  nexusRank: number;

  @Prop({ type: Types.ObjectId, ref: 'Realm', default: null, index: true })
  realmId: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1, status: 1, createdAt: -1 });
PostSchema.index({ nexusRank: -1 });
