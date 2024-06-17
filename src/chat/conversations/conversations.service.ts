import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Conversation } from '../schemas/conversation.schema';
import { Model } from 'mongoose';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  async findOrCreateConversation(
    senderId: string,
    receiverId: string,
  ): Promise<Conversation> {
    let conversation = await this.conversationModel.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });
    if (!conversation) {
      conversation = new this.conversationModel({
        sender: senderId,
        receiver: receiverId,
      });
      await conversation.save();
    }
    return conversation;
  }

  async addMessageToConversation(
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    await this.conversationModel.updateOne(
      { _id: conversationId },
      { $push: { messages: messageId } },
    );
  }

  async getConversationMessages(
    senderId: string,
    receiverId: string,
  ): Promise<any[]> {
    const conversation = await this.conversationModel
      .findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      })
      .populate('messages')
      .sort({ updatedAt: -1 });

    return conversation ? conversation.messages : [];
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return this.conversationModel
      .find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
      .populate('messages');
  }
}
