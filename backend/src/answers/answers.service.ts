import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Answer, AnswerDocument } from './schemas/answer.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UsersService } from '../users/users.service';
import { AnalysisService } from '../analysis/analysis.service';
import { BountyService } from '../posts/bounty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { EmailService } from '../mail/email.service';

@Injectable()
export class AnswersService {
  constructor(
    @InjectModel(Answer.name) private readonly answerModel: Model<AnswerDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly usersService: UsersService,
    private readonly analysisService: AnalysisService,
    private readonly bountyService: BountyService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async create(authorId: string, dto: CreateAnswerDto): Promise<AnswerDocument> {
    const post = await this.postModel.findById(dto.postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.exclusiveUntil && new Date(post.exclusiveUntil) > new Date()) {
      const expertIdStr =
        typeof post.targetedExpertId === 'object' && (post.targetedExpertId as any)?._id
          ? (post.targetedExpertId as any)._id.toString()
          : post.targetedExpertId?.toString();

      if (expertIdStr && authorId !== expertIdStr) {
        throw new ForbiddenException('This post is exclusively locked for a targeted expert.');
      }
    }

    let aiBotScore = 0;
    let status = 'approved';

    if (dto.text) {
      aiBotScore = await this.analysisService.evaluateBotProbability(dto.text);
      if (aiBotScore > 75) {
        status = 'quarantined';
      }
    }

    const created = new this.answerModel({
      postId: new Types.ObjectId(dto.postId),
      author: new Types.ObjectId(authorId),
      text: dto.text,
      audioNoteUrl: dto.audioNoteUrl,
      mediaUrls: dto.mediaUrls || [],
      status,
      aiBotScore,
      isAccepted: false,
    });

    const saved = await created.save();

    if (status === 'approved') {
      post.commentCount += 1;
      await post.save();

      // Trigger In-App Notification & Email Alerts for the post author
      try {
        const postWithAuthor = await this.postModel
          .findById(dto.postId)
          .populate('author', 'username email')
          .exec();

        if (postWithAuthor && postWithAuthor.author) {
          const authorObj: any = postWithAuthor.author;
          const postAuthorId = authorObj._id ? authorObj._id.toString() : authorObj.toString();
          const postAuthorEmail = authorObj.email;

          // Real-time In-App Notification
          await this.notificationsService.createNotification({
            recipientId: postAuthorId,
            senderId: authorId,
            type: NotificationType.REPLY,
            postId: dto.postId,
            message: `A contributor submitted an answer to your question: "${postWithAuthor.title?.slice(0, 35) || 'Post'}..."`,
          });

          // Email Alert for active bounty posts
          if (
            postWithAuthor.bountyAmount &&
            postWithAuthor.bountyAmount > 0 &&
            postWithAuthor.bountyStatus === 'active' &&
            postAuthorEmail
          ) {
            await this.emailService.sendBountyAlert(
              postAuthorEmail,
              postWithAuthor.title,
              postWithAuthor.bountyAmount,
            );
          }
        }
      } catch {
        // Non-blocking notification/email execution
      }
    }

    return saved;
  }

  async getAnswersForPost(postId: string): Promise<AnswerDocument[]> {
    if (!Types.ObjectId.isValid(postId)) {
      return [];
    }
    return this.answerModel
      .find({ postId: new Types.ObjectId(postId), status: 'approved' })
      .sort({ createdAt: -1 })
      .populate('author', 'username badges reputationXp reputationScore')
      .exec();
  }

  async acceptAnswer(answerId: string, requesterId: string): Promise<AnswerDocument> {
    if (!Types.ObjectId.isValid(answerId)) {
      throw new NotFoundException('Answer not found');
    }
    const answer = await this.answerModel.findById(answerId).exec();
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const post = await this.postModel.findById(answer.postId).exec();
    if (!post) {
      throw new NotFoundException('Post not found associated with this answer');
    }

    if (post.author.toString() !== requesterId) {
      throw new ForbiddenException('Only the original post author can accept an answer');
    }

    if (answer.isAccepted) {
      throw new BadRequestException('This answer has already been accepted');
    }

    // Toggle Accepted status
    answer.isAccepted = true;
    await answer.save();

    // Link accepted answer to the post
    post.acceptedAnswer = answer._id;
    await post.save();

    // Handle Bounty escrows payout via BountyService
    if (post.bountyStatus === 'active' && post.bountyAmount > 0) {
      await this.bountyService.resolveBounty(post._id.toString(), answer.author, requesterId);
    } else {
      post.bountyClaimed = true;
      await post.save();
    }

    // Real-time Notification to the answer author
    try {
      await this.notificationsService.createNotification({
        recipientId: answer.author.toString(),
        senderId: requesterId,
        type: NotificationType.BOUNTY_CLAIMED,
        postId: answer.postId.toString(),
        message: `Congratulations! Your answer was accepted and ${post.bountyAmount || 0} cr was awarded to your wallet!`,
      });
    } catch {
      // Non-blocking
    }

    return answer;
  }

  async upvote(answerId: string, userId: string): Promise<AnswerDocument> {
    if (!Types.ObjectId.isValid(answerId)) {
      throw new NotFoundException('Answer not found');
    }
    const answer = await this.answerModel.findById(answerId).exec();
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (!answer.upvotes) answer.upvotes = [];
    if (!answer.downvotes) answer.downvotes = [];

    const upvoteIndex = answer.upvotes.findIndex((id) => id.toString() === userId);
    const downvoteIndex = answer.downvotes.findIndex((id) => id.toString() === userId);

    if (upvoteIndex > -1) {
      answer.upvotes.splice(upvoteIndex, 1);
    } else {
      answer.upvotes.push(userObjectId);
      if (downvoteIndex > -1) {
        answer.downvotes.splice(downvoteIndex, 1);
      }
    }

    answer.voteScore = answer.upvotes.length - answer.downvotes.length;
    return answer.save();
  }

  async downvote(answerId: string, userId: string): Promise<AnswerDocument> {
    if (!Types.ObjectId.isValid(answerId)) {
      throw new NotFoundException('Answer not found');
    }
    const answer = await this.answerModel.findById(answerId).exec();
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    if (!answer.upvotes) answer.upvotes = [];
    if (!answer.downvotes) answer.downvotes = [];

    const upvoteIndex = answer.upvotes.findIndex((id) => id.toString() === userId);
    const downvoteIndex = answer.downvotes.findIndex((id) => id.toString() === userId);

    if (downvoteIndex > -1) {
      answer.downvotes.splice(downvoteIndex, 1);
    } else {
      answer.downvotes.push(userObjectId);
      if (upvoteIndex > -1) {
        answer.upvotes.splice(upvoteIndex, 1);
      }
    }

    answer.voteScore = answer.upvotes.length - answer.downvotes.length;
    return answer.save();
  }
}
