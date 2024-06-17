import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from '../schemas/message.schema';
import { Model } from 'mongoose';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async createMessage(data: any): Promise<Message> {
    const message = new this.messageModel(data);
    return message.save();
  }

  async markMessageAsSeen(userId: string, msgByUserId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        msgBYUserId: msgByUserId,
        seen: false,
      },
      {
        $set: { seen: true },
      },
    );
  }
}
