import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostsService } from '../posts/posts.service';
import { AnalysisService } from '../analysis/analysis.service';
import { UsersService } from '../users/users.service';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    private readonly postsService: PostsService,
    private readonly analysisService: AnalysisService,
    private readonly usersService: UsersService,
  ) {}

  async findById(id: string): Promise<CommentDocument | null> {
    return this.commentModel.findById(id).exec();
  }

  async addComment(authorId: string, dto: CreateCommentDto): Promise<CommentDocument> {
    await this.postsService.findById(dto.postId);

    const selfId = new Types.ObjectId();
    let path: string;
    let depth: number;
    const parentIdStr = dto.parentCommentId || dto.parentId;

    if (parentIdStr) {
      const parent = await this.commentModel.findById(parentIdStr).exec();
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.postId.toString() !== dto.postId) {
        throw new BadRequestException('Parent comment does not belong to this post');
      }
      if (parent.parentCommentId || parent.parentId) {
        throw new BadRequestException('Nested replies beyond one level are strictly not allowed');
      }
      path = `${parent.path}${selfId.toString()},`;
      depth = 1;
    } else {
      path = `,${dto.postId},${selfId.toString()},`;
      depth = 0;
    }

    const score = await this.analysisService.evaluateBotProbability(dto.body);
    const status = score > 70 ? 'quarantined' : 'approved';

    const parentObjectId = parentIdStr ? new Types.ObjectId(parentIdStr) : null;

    const created = new this.commentModel({
      _id: selfId,
      postId: new Types.ObjectId(dto.postId),
      authorId: new Types.ObjectId(authorId),
      parentId: parentObjectId,
      parentCommentId: parentObjectId,
      body: dto.body,
      path,
      depth,
      status,
      aiBotScore: score,
      upvotes: [],
    });

    const saved = await created.save();
    
    if (status === 'approved') {
      await this.postsService.incrementCommentCount(dto.postId, 1);
    }
    
    return saved;
  }

  async toggleUpvote(commentId: string, userId: string): Promise<CommentDocument> {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('Comment not found');
    }
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const userObjId = new Types.ObjectId(userId);
    if (!comment.upvotedBy) comment.upvotedBy = [];
    if (!comment.upvotes) comment.upvotes = [];

    const isUpvoted =
      comment.upvotedBy.some((id) => id.toString() === userId) ||
      comment.upvotes.some((id) => id.toString() === userId);

    if (isUpvoted) {
      // Remove upvote
      comment.upvotedBy = comment.upvotedBy.filter((id) => id.toString() !== userId);
      comment.upvotes = comment.upvotes.filter((id) => id.toString() !== userId);

      // Decrement author's wallet & reputation atomically
      if (comment.authorId) {
        await this.usersService.updateReputationAndWallet(comment.authorId, -1, -1);
      }
    } else {
      // Add upvote
      comment.upvotedBy.push(userObjId);
      comment.upvotes.push(userObjId);

      // Increment author's wallet & reputation atomically
      if (comment.authorId) {
        await this.usersService.updateReputationAndWallet(comment.authorId, 1, 1);
      }
    }

    return comment.save();
  }

  async getThread(postId: string): Promise<CommentDocument[]> {
    if (!Types.ObjectId.isValid(postId)) {
      return [];
    }
    const anchor = new RegExp(`^,${escapeRegex(postId)},`);
    return this.commentModel
      .find({ path: anchor, status: 'approved' })
      .sort({ path: 1 })
      .populate('authorId', 'username reputationScore walletBalance')
      .exec();
  }

  async getSubtree(commentId: string): Promise<CommentDocument[]> {
    const target = await this.commentModel.findById(commentId).exec();
    if (!target) {
      throw new NotFoundException('Comment not found');
    }
    const subtreeAnchor = new RegExp(`^${escapeRegex(target.path)}`);
    return this.commentModel
      .find({ path: subtreeAnchor, status: 'approved' })
      .sort({ path: 1 })
      .populate('authorId', 'username reputationScore walletBalance')
      .exec();
  }
}
