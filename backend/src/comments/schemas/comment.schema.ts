import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parentCommentId: Types.ObjectId | null;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  upvotedBy: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  upvotes: Types.ObjectId[];

  @Prop({ required: true, trim: true, maxlength: 3000 })
  body: string;

  /**
   * Materialized path, comma-delimited and padded with leading/trailing
   * commas: ",<postId>,<ancestorCommentId1>,...,<selfCommentId>,"
   * The postId is embedded as the first segment so an entire discussion
   * thread can be retrieved with a single anchored regex prefix query
   * (index-friendly: MongoDB can use a btree index for "^,postId," regexes).
   * Because a child's path is always its parent's path with the child's own
   * id appended, a plain lexical sort on `path` yields correct topological
   * (parent-before-child) order for the whole thread in one pass.
   */
  @Prop({ required: true, index: true })
  path: string;

  @Prop({ default: 0 })
  depth: number;

  @Prop({ type: String, enum: ['approved', 'quarantined'], default: 'approved', index: true })
  status: string;

  @Prop({ default: 0 })
  aiBotScore: number;

  @Prop({ default: false })
  isAccepted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ postId: 1, path: 1 });
CommentSchema.index({ postId: 1, parentCommentId: 1 });
CommentSchema.index({ postId: 1, createdAt: 1 });
