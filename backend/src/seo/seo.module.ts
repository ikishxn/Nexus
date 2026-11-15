import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Realm, RealmSchema } from '../realms/schemas/realm.schema';
import { SeoController } from './seo.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Realm.name, schema: RealmSchema },
    ]),
  ],
  controllers: [SeoController],
})
export class SeoModule {}
