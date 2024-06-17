import { Module } from '@nestjs/common';
import { ConversationsService } from './conversations/conversations.service';
import { MessagesService } from './messages/messages.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [ChatGateway, ConversationsService, MessagesService],
})
export class ChatModule {}
