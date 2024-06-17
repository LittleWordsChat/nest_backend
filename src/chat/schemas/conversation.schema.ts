import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Message } from "./message.schema";

@Schema({ timestamps: true })
export class Conversation extends Document {
    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    sender: Types.ObjectId

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    reciver: Types.ObjectId

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }] })
    messages: Message[]
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation)