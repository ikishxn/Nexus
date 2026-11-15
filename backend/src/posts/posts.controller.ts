import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PostsService, PaginatedFeed } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import { PostDocument } from './schemas/post.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { EmailService } from '../mail/email.service';
import { UsersService } from '../users/users.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @HttpPost()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ): Promise<PostDocument> {
    const bountyAmount = Number(dto.bountyAmount || 0);
    const threadStyle = dto.threadStyle;
    const initialRank = (0 / 45000) + (bountyAmount * 0.5) + (threadStyle === 'debate' ? 0.5 : 0);

    const post = await this.postsService.create(user.userId, dto, initialRank);

    // If targetedExpertId is provided, trigger critical socket notification & email alert
    if (post.targetedExpertId) {
      const expertIdStr = post.targetedExpertId.toString();
      try {
        const expert = await this.usersService.findById(expertIdStr);

        // 1. WebSocket gateway critical notification
        await this.notificationsService.createNotification({
          recipientId: expertIdStr,
          senderId: user.userId,
          type: NotificationType.TARGETED_BOUNTY,
          postId: post._id.toString(),
          message: `${user.username || 'A creator'} requested your expertise on "${post.title?.slice(0, 35)}..." with an exclusive ${post.bountyAmount || 0} cr bounty!`,
        });

        // 2. High-priority Nodemailer email alert
        if (expert?.email) {
          await this.emailService.sendTargetedBountyRequest(
            expert.email,
            post.title,
            post.bountyAmount || 0,
            user.username || 'A creator',
          );
        }
      } catch {
        // Non-blocking notification
      }
    }

    return post;
  }

  @Get()
  async getFeed(@Query() query: GetFeedDto): Promise<PaginatedFeed> {
    return this.postsService.getFeed(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostDocument> {
    return this.postsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.postsService.delete(id, user.userId, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/accept-answer')
  @HttpCode(HttpStatus.OK)
  async acceptAnswer(
    @Param('id') id: string,
    @Body('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostDocument> {
    return this.postsService.acceptAnswer(id, commentId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/upvote')
  @HttpCode(HttpStatus.OK)
  async upvote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostDocument> {
    const post = await this.postsService.upvote(id, user.userId);

    // If upvoted, trigger real-time notification to post author
    try {
      const isUpvoted = post.upvotes?.some((uid) => uid.toString() === user.userId);
      if (isUpvoted && post.author) {
        const postAuthorId = (typeof post.author === 'object' && (post.author as any)._id)
          ? (post.author as any)._id.toString()
          : post.author.toString();

        await this.notificationsService.createNotification({
          recipientId: postAuthorId,
          senderId: user.userId,
          type: NotificationType.UPVOTE,
          postId: id,
          message: `${user.username || 'A contributor'} upvoted your post: "${post.title?.slice(0, 35) || 'Post'}..."`,
        });
      }
    } catch {
      // Non-blocking
    }

    return post;
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/downvote')
  @HttpCode(HttpStatus.OK)
  async downvote(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PostDocument> {
    return this.postsService.downvote(id, user.userId);
  }
}
