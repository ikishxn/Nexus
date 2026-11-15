import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ChatModule } from './chat/chat.module';
import { MediaModule } from './media/media.module';
import { AnalysisModule } from './analysis/analysis.module';
import { AnswersModule } from './answers/answers.module';
import { AiModule } from './ai/ai.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RealmsModule } from './realms/realms.module';
import { SearchModule } from './search/search.module';
import { SeoModule } from './seo/seo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/dev_forum'),
      }),
    }),
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    ChatModule,
    MediaModule,
    AnalysisModule,
    AnswersModule,
    AiModule,
    PaymentsModule,
    NotificationsModule,
    MailModule,
    RealmsModule,
    SearchModule,
    SeoModule,
  ],
})
export class AppModule {}
