import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../posts/schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Realm, RealmDocument } from '../realms/schemas/realm.schema';

export interface SearchResults {
  posts: any[];
  realms: any[];
  users: any[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Realm.name) private realmModel: Model<RealmDocument>,
  ) {}

  async search(q: string): Promise<SearchResults> {
    const [posts, realms, users] = await Promise.all([
      this.searchPosts(q),
      this.searchRealms(q),
      this.searchUsers(q),
    ]);
    return { posts, realms, users };
  }

  private async searchPosts(q: string): Promise<any[]> {
    // Try Atlas $search first, fall back to $regex if $search is unavailable
    try {
      const results = await this.postModel.aggregate([
        {
          $search: {
            index: 'default',
            text: {
              query: q,
              path: ['title', 'content.text', 'tags'],
              fuzzy: { maxEdits: 2 },
            },
          },
        },
        { $match: { status: 'approved' } },
        {
          $addFields: {
            searchScore: { $meta: 'searchScore' },
          },
        },
        { $sort: { searchScore: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, reputationScore: 1 } }],
          },
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            title: 1,
            category: 1,
            voteScore: 1,
            commentCount: 1,
            createdAt: 1,
            searchScore: 1,
            'author.username': 1,
            'author._id': 1,
            'content.text': 1,
          },
        },
      ]);
      return results;
    } catch {
      // Fallback: regex search for local/non-Atlas MongoDB
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return this.postModel
        .find({
          status: 'approved',
          $or: [{ title: regex }, { 'content.text': regex }],
        })
        .limit(8)
        .sort({ nexusRank: -1, createdAt: -1 })
        .populate('author', 'username reputationScore')
        .select('_id title category voteScore commentCount createdAt content author')
        .lean();
    }
  }

  private async searchRealms(q: string): Promise<any[]> {
    try {
      const results = await this.realmModel.aggregate([
        {
          $search: {
            index: 'default',
            text: {
              query: q,
              path: ['name', 'description', 'displayName'],
              fuzzy: { maxEdits: 2 },
            },
          },
        },
        {
          $addFields: { searchScore: { $meta: 'searchScore' } },
        },
        { $sort: { searchScore: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 1,
            name: 1,
            displayName: 1,
            description: 1,
            themeColor: 1,
            memberCount: 1,
            searchScore: 1,
          },
        },
      ]);
      return results;
    } catch {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return this.realmModel
        .find({ $or: [{ name: regex }, { displayName: regex }, { description: regex }] })
        .limit(5)
        .sort({ memberCount: -1 })
        .select('_id name displayName description themeColor memberCount')
        .lean();
    }
  }

  private async searchUsers(q: string): Promise<any[]> {
    const regex = new RegExp('^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.userModel
      .find({ username: regex })
      .limit(5)
      .sort({ reputationScore: -1 })
      .select('_id username reputationScore badges')
      .lean();
  }
}
