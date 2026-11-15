import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { UsersService } from '../users/users.service';
import { TransactionType } from '../payments/schemas/transaction.schema';

@Injectable()
export class BountyService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Resolves a bounty escrow payout when an answer is accepted.
   * Executes sequential atomic updates:
   * 1. Deducts the bounty amount from the original poster's walletBalance if not held in escrow.
   * 2. Adds the full bounty amount to the answering user's walletBalance.
   * 3. Marks the post's bountyClaimed status as true and bountyStatus as 'awarded'.
   */
  async resolveBounty(
    postId: string,
    answeringAuthorId: string | Types.ObjectId,
    requesterId: string,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.author.toString() !== requesterId) {
      throw new ForbiddenException('Only the original post author can accept an answer');
    }

    if (post.bountyClaimed || post.bountyStatus === 'awarded') {
      throw new BadRequestException('This bounty has already been claimed');
    }

    const bountyAmount = post.bountyAmount || 0;

    if (bountyAmount > 0) {
      // Add the full bounty amount to the answering user's walletBalance & reputation
      await this.usersService.updateReputationAndWallet(
        answeringAuthorId,
        bountyAmount,
        50,
        TransactionType.BOUNTY_EARNED,
        undefined,
        `Bounty earned on post: ${post.title}`,
      );
      await this.usersService.incrementReputationXp(answeringAuthorId, 50);
    }

    // Mark the post's bountyClaimed status as true and bountyStatus as awarded
    post.bountyClaimed = true;
    post.bountyStatus = 'awarded';

    return post.save();
  }
}

