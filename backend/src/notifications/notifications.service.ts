import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationDto {
  recipientId: string | Types.ObjectId;
  senderId: string | Types.ObjectId;
  type: NotificationType;
  postId: string | Types.ObjectId;
  message?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Creates a notification, saves it to the database, and broadcasts it in real-time via WebSocket.
   */
  async createNotification(data: CreateNotificationDto): Promise<NotificationDocument | null> {
    const recipientStr = data.recipientId.toString();
    const senderStr = data.senderId.toString();

    // Do not notify a user about their own actions
    if (recipientStr === senderStr) {
      return null;
    }

    if (!Types.ObjectId.isValid(recipientStr) || !Types.ObjectId.isValid(data.postId.toString())) {
      this.logger.warn(`Invalid ObjectId in notification payload: ${JSON.stringify(data)}`);
      return null;
    }

    const created = new this.notificationModel({
      recipientId: new Types.ObjectId(recipientStr),
      senderId: new Types.ObjectId(senderStr),
      type: data.type,
      postId: new Types.ObjectId(data.postId.toString()),
      message: data.message,
      read: false,
    });

    const saved = await created.save();

    // Populate sender and post info for immediate rich frontend display
    const populated = await this.notificationModel
      .findById(saved._id)
      .populate('senderId', 'username reputationScore badges')
      .populate('postId', 'title')
      .exec();

    // Emit real-time WebSocket event to the recipient
    this.gateway.emitToUser(recipientStr, 'newNotification', populated || saved);

    return saved;
  }

  /**
   * Retrieves all notifications for a specific user, sorted from newest to oldest.
   */
  async getUserNotifications(userId: string): Promise<NotificationDocument[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }

    return this.notificationModel
      .find({ recipientId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'username reputationScore badges')
      .populate('postId', 'title')
      .exec();
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    if (!Types.ObjectId.isValid(notificationId) || !Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Notification not found');
    }

    const notification = await this.notificationModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(notificationId),
          recipientId: new Types.ObjectId(userId),
        },
        { $set: { read: true } },
        { new: true },
      )
      .populate('senderId', 'username reputationScore badges')
      .populate('postId', 'title')
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found or access denied');
    }

    return notification;
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return { updatedCount: 0 };
    }

    const res = await this.notificationModel
      .updateMany(
        {
          recipientId: new Types.ObjectId(userId),
          read: false,
        },
        { $set: { read: true } },
      )
      .exec();

    return { updatedCount: res.modifiedCount };
  }

  /**
   * Gets the count of unread notifications for a user.
   */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    if (!Types.ObjectId.isValid(userId)) {
      return { unreadCount: 0 };
    }

    const unreadCount = await this.notificationModel
      .countDocuments({
        recipientId: new Types.ObjectId(userId),
        read: false,
      })
      .exec();

    return { unreadCount };
  }
}

