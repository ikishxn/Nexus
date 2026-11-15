import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { Comment, CommentSchema } from '../comments/schemas/comment.schema';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { RankingService } from './ranking.service';
import { BountyService } from './bounty.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
    UsersModule,
    AnalysisModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, RankingService, BountyService],
  exports: [PostsService, BountyService, MongooseModule],
})
export class PostsModule {}
