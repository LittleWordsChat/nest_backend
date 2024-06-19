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
      .sort({ updatedAt: -1 })
      .exec();
    return conversation ? conversation.messages : [];
  }

  async getConversation(currentUserId: string): Promise<any[]> {
    if (currentUserId) {
      const currentUserConversation = await this.conversationModel
        .find({
          $or: [{ sender: currentUserId }, { receiver: currentUserId }],
        })
        .sort({ updateAt: -1 })
        .populate('messages')
        .populate('sender')
        .populate('receiver');
      const conversation = currentUserConversation.map((conv) => {
        const countUnseenMsg = conv?.messages?.reduce((prev, curr) => {
          const msgByUserId = curr?.msgByUserId?.toString();
          if (msgByUserId !== currentUserId) return prev + (curr.seen ? 0 : 1);
          else return prev;
        }, 0);
        return {
          _id: conv?._id,
          sender: conv?.sender,
          receiver: conv?.receiver,
          unseenMsg: countUnseenMsg,
          lastMsg: conv.messages[conv?.messages?.length - 1],
        };
      });
      return conversation;
    } else {
      return [];
    }
  }
}
