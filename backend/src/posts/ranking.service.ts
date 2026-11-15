import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class RankingService implements OnModuleInit {
  private readonly logger = new Logger(RankingService.name);

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('Initial calculation of Nexus Rank on startup...');
    await this.updateRanks();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateRanks() {
    this.logger.log('Calculating Nexus Rank for active posts...');
    try {
      // Fetch only posts where status is active ('approved')
      const posts = await this.postModel.find({ status: 'approved' }).exec();
      this.logger.log(`Found ${posts.length} active posts to evaluate.`);

      const bulkOps = [];

      for (const post of posts) {
        const ageInSeconds = (Date.now() - post.createdAt.getTime()) / 1000;
        const upvotesCount = post.upvotes?.length || 0;
        const downvotesCount = post.downvotes?.length || 0;

        const baseScore = Math.log10(Math.max(upvotesCount - downvotesCount, 1)) + (ageInSeconds / 45000);

        // Heavy weight for active bounties (e.g., $10 bounty adds 5.0 to the base score)
        const bountyClaimed = post.bountyStatus === 'awarded';
        const bountyWeight = (post.bountyAmount > 0 && !bountyClaimed) ? (post.bountyAmount * 0.5) : 0;

        // Format boost for high-effort thread styles
        const formatBoost = post.threadStyle === 'debate' ? 0.5 : 0;

        // Trust multiplier from Gemini AI analysis
        const aiMultiplier = post.aiBotScore < 20 ? 1.2 : (post.aiBotScore > 80 ? 0.1 : 1.0);

        const nexusRank = (baseScore + bountyWeight + formatBoost) * aiMultiplier;

        bulkOps.push({
          updateOne: {
            filter: { _id: post._id },
            update: { $set: { nexusRank } },
          },
        });
      }

      if (bulkOps.length > 0) {
        const result = await this.postModel.bulkWrite(bulkOps);
        this.logger.log(`Nexus Rank update completed. Modified: ${result.modifiedCount} posts.`);
      } else {
        this.logger.log('No posts to update.');
      }
    } catch (error) {
      this.logger.error('Failed to run Nexus Rank calculation:', error);
    }
  }
}
