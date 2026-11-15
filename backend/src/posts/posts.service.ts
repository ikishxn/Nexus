import { ForbiddenException, Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Post, PostDocument, PostType } from './schemas/post.schema';
import { Comment, CommentDocument } from '../comments/schemas/comment.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { UsersService } from '../users/users.service';
import { AnalysisService } from '../analysis/analysis.service';
import { TransactionType } from '../payments/schemas/transaction.schema';

export interface PaginatedFeed {
  items: PostDocument[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    private readonly usersService: UsersService,
    private readonly analysisService: AnalysisService,
  ) {}

  async create(authorId: string, dto: CreatePostDto, initialRank?: number): Promise<PostDocument> {
    let bountyAmount = 0;
    let bountyStatus = 'none';

    if (dto.bountyAmount && dto.bountyAmount > 0) {
      const user = await this.usersService.findById(authorId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (user.walletBalance < dto.bountyAmount) {
        throw new UnauthorizedException('Insufficient wallet balance for this bounty');
      }
      await this.usersService.updateWalletBalance(
        authorId,
        -dto.bountyAmount,
        TransactionType.BOUNTY_PAID,
        undefined,
        `Bounty escrow locked for post: ${dto.title}`,
      );
      bountyAmount = dto.bountyAmount;
      bountyStatus = 'active';
    }

    // Run AI content screening on the post text body for metadata/scoring
    let aiBotScore = 0;
    if (dto.content.text) {
      try {
        aiBotScore = await this.analysisService.evaluateBotProbability(dto.content.text);
      } catch {
        aiBotScore = 0;
      }
    }
    const status = 'approved';

    let targetedExpertId: Types.ObjectId | null = null;
    let exclusiveUntil: Date | null = null;

    if (dto.targetedExpertId && Types.ObjectId.isValid(dto.targetedExpertId)) {
      targetedExpertId = new Types.ObjectId(dto.targetedExpertId);
      // exactly 24 hours from createdAt
      exclusiveUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const computedInitialRank = initialRank !== undefined
      ? initialRank
      : (0 / 45000) + (bountyAmount * 0.5) + (dto.threadStyle === 'debate' ? 0.5 : 0);

    const created = new this.postModel({
      title: dto.title,
      content: dto.content,
      category: typeof dto.category === 'string' ? dto.category.toLowerCase().trim() : dto.category,
      postType: dto.postType || PostType.POST,
      threadStyle: dto.threadStyle,
      stance: dto.stance,
      bountyAmount,
      bountyStatus,
      status: status || 'approved',
      aiBotScore,
      targetedExpertId,
      exclusiveUntil,
      nexusRank: computedInitialRank,
      realmId: dto.realmId && Types.ObjectId.isValid(dto.realmId) ? new Types.ObjectId(dto.realmId) : null,
      author: new Types.ObjectId(authorId),
      upvotes: [],
      downvotes: [],
    });

    return created.save();
  }

  async getFeed(query: GetFeedDto): Promise<PaginatedFeed> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    
    // Only return posts where status is 'approved'
    const filter: FilterQuery<PostDocument> = { status: 'approved' };
    if (
      query.category &&
      query.category !== 'All Topics' &&
      query.category.toLowerCase().trim() !== 'all' &&
      query.category.toLowerCase().trim() !== 'all topics'
    ) {
      filter.category = query.category.toLowerCase().trim();
    }

    if (query.realmId && Types.ObjectId.isValid(query.realmId)) {
      filter.realmId = new Types.ObjectId(query.realmId);
    } else if (query.realmName) {
      const realm = await this.postModel.db.collection('realms').findOne({ name: query.realmName.toLowerCase().trim() });
      filter.realmId = realm ? realm._id : null;
    } else {
      filter.realmId = null;
    }

    let sortQuery: any = { nexusRank: -1, createdAt: -1 }; // Default: Trending

    if (query.sortBy) {
      const sortTab = query.sortBy.toLowerCase().trim();
      if (sortTab === 'latest') {
        sortQuery = { createdAt: -1 };
      } else if (sortTab === 'top voted' || sortTab === 'top-voted') {
        sortQuery = { voteScore: -1, votesScore: -1 };
      } else if (sortTab === 'trending') {
        sortQuery = { nexusRank: -1, createdAt: -1 };
      }
    }

    console.log('[DEBUG] Mongoose Feed Filter:', filter);
    console.log('[DEBUG] Mongoose Feed Sort:', sortQuery);

    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort(sortQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'username reputationScore walletBalance badges')
        .populate('targetedExpertId', 'username reputationScore walletBalance badges')
        .exec(),
      this.postModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const post = await this.postModel
      .findById(id)
      .populate('author', 'username reputationScore walletBalance badges')
      .populate('targetedExpertId', 'username reputationScore walletBalance badges')
      .exec();
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async incrementCommentCount(postId: string | Types.ObjectId, amount = 1): Promise<void> {
    if (!Types.ObjectId.isValid(postId.toString())) return;
    await this.postModel.findByIdAndUpdate(postId, { $inc: { commentCount: amount } }).exec();
  }

  async delete(id: string, requesterId: string, requesterRole?: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    const isAuthor = post.author.toString() === requesterId;
    const isAdmin = requesterRole === 'ADMIN';
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this post');
    }
    post.status = 'deleted';
    post.content = {
      text: '[Deleted by user]',
      codeSnippet: '',
      mediaUrls: [],
    };
    await post.save();
  }

  async upvote(postId: string, userId: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (!post.upvotedBy) post.upvotedBy = [];
    if (!post.upvotes) post.upvotes = [];
    if (!post.downvotes) post.downvotes = [];

    const isUpvoted =
      post.upvotedBy.some((id) => id.toString() === userId) ||
      post.upvotes.some((id) => id.toString() === userId);
    const downvoteIndex = post.downvotes.findIndex((id) => id.toString() === userId);

    if (isUpvoted) {
      // Toggle off upvote
      post.upvotedBy = post.upvotedBy.filter((id) => id.toString() !== userId);
      post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);

      // Decrement author's walletBalance and totalReputation atomically
      if (post.author) {
        await this.usersService.updateReputationAndWallet(post.author, -1, -1);
      }
    } else {
      // Toggle on upvote
      post.upvotedBy.push(userObjectId);
      post.upvotes.push(userObjectId);

      // If downvoted, remove downvote
      if (downvoteIndex > -1) {
        post.downvotes.splice(downvoteIndex, 1);
      }

      // Increment author's walletBalance and totalReputation atomically
      if (post.author) {
        await this.usersService.updateReputationAndWallet(post.author, 1, 1);
      }
    }

    post.voteScore = post.upvotes.length - post.downvotes.length;
    return post.save();
  }

  async downvote(postId: string, userId: string): Promise<PostDocument> {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (!post.upvotedBy) post.upvotedBy = [];
    if (!post.upvotes) post.upvotes = [];
    if (!post.downvotes) post.downvotes = [];

    const isUpvoted =
      post.upvotedBy.some((id) => id.toString() === userId) ||
      post.upvotes.some((id) => id.toString() === userId);
    const downvoteIndex = post.downvotes.findIndex((id) => id.toString() === userId);

    if (isUpvoted) {
      // Remove upvote and deduct the reward previously earned
      post.upvotedBy = post.upvotedBy.filter((id) => id.toString() !== userId);
      post.upvotes = post.upvotes.filter((id) => id.toString() !== userId);

      if (post.author) {
        await this.usersService.updateReputationAndWallet(post.author, -1, -1);
      }
    }

    if (downvoteIndex > -1) {
      // Toggle off downvote
      post.downvotes.splice(downvoteIndex, 1);
    } else {
      // Toggle on downvote
      post.downvotes.push(userObjectId);
    }

    post.voteScore = post.upvotes.length - post.downvotes.length;
    return post.save();
  }

  // Fallback function for compatibility with Phase 1 acceptAnswer comment trigger
  async acceptAnswer(postId: string, commentId: string, requesterId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== requesterId) {
      throw new ForbiddenException('Only the post author can accept an answer');
    }

    if (post.bountyStatus !== 'active' || post.bountyAmount <= 0) {
      throw new BadRequestException('This post does not have an active bounty to award');
    }

    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.usersService.updateReputationAndWallet(
      comment.authorId,
      post.bountyAmount,
      50,
      TransactionType.BOUNTY_EARNED,
      undefined,
      `Bounty earned on post: ${post.title}`,
    );

    comment.isAccepted = true;
    await comment.save();

    post.bountyClaimed = true;
    post.bountyStatus = 'awarded';
    post.acceptedCommentId = comment._id;
    return post.save();
  }
}
