import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Message extends Document {
    @Prop({ default: "" })
    text: string

    @Prop({ default: "" })
    imageUrl?: string

    @Prop({ default: "" })
    videoUrl?: string

    @Prop({ default: false })
    seen: boolean

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    msgBYUserId: Types.ObjectId

}

export const MessageSchema = SchemaFactory.createForClass(Message)