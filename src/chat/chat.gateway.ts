import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { ConversationsService } from './conversations/conversations.service';
import { MessagesService } from './messages/messages.service';

@WebSocketGateway({ cors: { origin: true, credetentials: true } })
export class ChatGateway
  implements OnGatewayInit<Server>, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  private onlineUsers = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  afterInit(server: Server): void {
    this.logger.log('Init');
  }

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected ${client.id}`);

    const token = client.handshake.auth.token || client.handshake.headers.token;
    const decoded = this.jwtService.verify(token);
    const user = await this.usersService.findOneById(decoded.userId);

    if (user) {
      client.join(user._id.toString());
      this.onlineUsers.add(user._id.toString());
      this.server.emit('onlineUsers', Array.from(this.onlineUsers));
    } else {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const token = client.handshake.auth.token || client.handshake.headers.token;
    const decoded = this.jwtService.verify(token);
    this.onlineUsers.delete(decoded.userId.toString());
    this.logger.log(`Client disconnect ${client.id}`);
    this.server.emit('onlineUsers', Array.from(this.onlineUsers));
  }

  @SubscribeMessage('message-page')
  async handleMessagePage(client: Socket, userId: string): Promise<void> {
    const user = await this.usersService.findOneById(userId);
    const payload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profile_pic: user.profile_pic,
      online: this.onlineUsers.has(userId),
    };

    client.emit('message-user', payload);

    const conversationMessages =
      await this.conversationsService.getConversationMessages(
        user._id.toString(),
        userId,
      );
    client.emit('message', conversationMessages);
  }

  @SubscribeMessage('newMessage')
  async handleNewMessage(client: Socket, data: any): Promise<void> {
    const conversation =
      await this.conversationsService.findOrCreateConversation(
        data.sender,
        data.reciver,
      );
    const message = await this.messagesService.createMessage({
      text: data.text,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
      msgByUserId: data.msgByUserId,
    });

    await this.conversationsService.addMessageToConversation(
      conversation._id.toString(),
      message._id.toString(),
    );

    const updatedMessages =
      await this.conversationsService.getConversationMessages(
        data.sender,
        data.receiver,
      );

    this.server.to(data.sender).emit('message', updatedMessages);
    this.server.to(data.receiver).emit('message', updatedMessages);

    const conversationSender =
      await this.conversationsService.getUserConversations(data.sender);
    const conversationReceiver =
      await this.conversationsService.getUserConversations(data.receiver);

    this.server.to(data.sender).emit('conversation', conversationSender);
    this.server.to(data.receiver).emit('conversation', conversationReceiver);
  }

  @SubscribeMessage('sidebar')
  async handleSidebar(client: Socket, currentUserId: string): Promise<void> {
    const conversations =
      await this.conversationsService.getUserConversations(currentUserId);
    client.emit('conversation', conversations);
  }

  @SubscribeMessage('seen')
  async handleSeen(client: Socket, msgByUserId: string): Promise<void> {
    const token = client.handshake.auth.token || client.handshake.headers.token;
    const decoded = this.jwtService.verify(token);
    const userId = decoded.userId;

    await this.messagesService.markMessageAsSeen(userId, msgByUserId);

    const conversationSender =
      await this.conversationsService.getUserConversations(userId);
    const conversationReceiver =
      await this.conversationsService.getUserConversations(msgByUserId);

    this.server.to(userId).emit('conversation', conversationSender);
    this.server.to(msgByUserId).emit('conversation', conversationReceiver);
  }
}
