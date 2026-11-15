import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentDocument } from './schemas/comment.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import { PostsService } from '../posts/posts.service';

@Controller('comments')
export class CommentsController {
  private readonly logger = new Logger(CommentsController.name);

  constructor(
    private readonly commentsService: CommentsService,
    private readonly notificationsService: NotificationsService,
    private readonly postsService: PostsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    // Exclusivity Action Guard: check 24-hour targeted expert lock
    const post = await this.postsService.findById(dto.postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.exclusiveUntil && new Date(post.exclusiveUntil) > new Date()) {
      const expertIdStr =
        typeof post.targetedExpertId === 'object' && (post.targetedExpertId as any)?._id
          ? (post.targetedExpertId as any)._id.toString()
          : post.targetedExpertId?.toString();

      if (expertIdStr && user.userId !== expertIdStr) {
        throw new ForbiddenException('This post is exclusively locked for a targeted expert.');
      }
    }

    const parentId = dto.parentCommentId || dto.parentId;
    let parentComment: CommentDocument | null = null;

    if (parentId) {
      parentComment = await this.commentsService.findById(parentId);
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.parentCommentId || parentComment.parentId) {
        throw new BadRequestException('Nested replies beyond one level are strictly not allowed');
      }
    }

    const comment = await this.commentsService.addComment(user.userId, dto);

    // Trigger real-time Notification Hook
    try {
      const post = await this.postsService.findById(dto.postId);
      const postTitle = post?.title
        ? post.title.length > 35
          ? `${post.title.slice(0, 35)}...`
          : post.title
        : 'Post';

      let recipientId: string | null = null;
      let notificationMessage: string = '';

      if (parentComment && parentComment.authorId) {
        // Nested reply: find the author of that parent comment and set them as recipientId
        const parentAuthorId =
          typeof parentComment.authorId === 'object' && (parentComment.authorId as any)._id
            ? (parentComment.authorId as any)._id.toString()
            : parentComment.authorId.toString();

        recipientId = parentAuthorId;
        notificationMessage = `${user.username || 'A contributor'} replied to your comment on "${postTitle}"`;
      } else if (post && post.author) {
        // Top-level comment: set recipientId to the author of the main Post
        const postAuthorId =
          typeof post.author === 'object' && (post.author as any)._id
            ? (post.author as any)._id.toString()
            : post.author.toString();

        recipientId = postAuthorId;
        notificationMessage = `${user.username || 'A contributor'} replied to your post: "${postTitle}"`;
      }

      if (recipientId) {
        // Timing fix: Ensure the notification document is fully saved to MongoDB
        // before emitting the newNotification event via WebSocket (handled within createNotification)
        await this.notificationsService.createNotification({
          recipientId,
          senderId: user.userId,
          type: NotificationType.REPLY,
          postId: dto.postId,
          message: notificationMessage,
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to dispatch comment notification: ${err?.message || err}`);
    }

    return comment;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upvote')
  async toggleUpvote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CommentDocument> {
    return this.commentsService.toggleUpvote(id, user.userId);
  }

  @Get('post/:postId')
  async getThread(@Param('postId') postId: string): Promise<CommentDocument[]> {
    return this.commentsService.getThread(postId);
  }

  @Get(':id/subtree')
  async getSubtree(@Param('id') id: string): Promise<CommentDocument[]> {
    return this.commentsService.getSubtree(id);
  }
}
