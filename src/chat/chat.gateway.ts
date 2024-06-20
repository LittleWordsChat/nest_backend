import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
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
    try {
      this.logger.log(`Client connected ${client.id}`);

      const token =
        client.handshake.auth.token || client.handshake.headers.token;
      console.log(token);
      const decoded = await this.jwtService.verify(token);
      console.log(decoded);
      const user = await this.usersService.findOneById(decoded.sub);

      if (user) {
        client['user'] = user;
        client.join(user._id.toString());
        this.onlineUsers.add(user._id.toString());
        this.server.emit('onlineUsers', Array.from(this.onlineUsers));
      } else {
        client.disconnect();
      }
    } catch (error) {
      this.server.emit('auth-error', error.message);
      //this.handleDisconnect(client);
    }
  }

  @SubscribeMessage('message-page')
  async handleMessagePage(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ): Promise<void> {
    try {
      console.log('1', userId);
      const token =
        client.handshake.auth.token || client.handshake.headers.token;
      await this.jwtService.verify(token);
      const user = client['user'];
      const userDetails = await this.usersService.findOneById(userId);
      const payload = {
        _id: userDetails._id,
        name: userDetails.name,
        email: userDetails.email,
        profile_pic: userDetails.profile_pic,
        online: this.onlineUsers.has(userId),
      };
      client.emit('message-user', payload);

      const conversationMessages =
        await this.conversationsService.getConversationMessages(
          user._id.toString(),
          userId,
        );
      client.emit('message', conversationMessages);
    } catch (error) {
      console.log('error 1', error);
      this.server.emit('auth-error', error.message);
    }
  }

  @SubscribeMessage('new-message')
  async handleNewMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): Promise<void> {
    try {
      console.log('2', data);
      const token =
        client.handshake.auth.token || client.handshake.headers.token;
      await this.jwtService.verify(token);
      const conversation =
        await this.conversationsService.findOrCreateConversation(
          data.sender,
          data.receiver,
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

      const getConversationMessage =
        await this.conversationsService.getConversationMessages(
          data.sender,
          data.receiver,
        );

      this.server.to(data.sender).emit('message', getConversationMessage);
      this.server.to(data.receiver).emit('message', getConversationMessage);

      const conversationSender =
        await this.conversationsService.getConversation(data.sender);
      const conversationReceiver =
        await this.conversationsService.getConversation(data.receiver);

      this.server.to(data.sender).emit('conversation', conversationSender);
      this.server.to(data.receiver).emit('conversation', conversationReceiver);
    } catch (error) {
      console.log('error 2', error);
      this.server.emit('auth-error', error.message);
    }
  }

  @SubscribeMessage('sidebar')
  async handleSidebar(
    @ConnectedSocket() client: Socket,
    @MessageBody() currentUserId: string,
  ): Promise<void> {
    try {
      console.log('3', currentUserId);
      const token =
        client.handshake.auth.token || client.handshake.headers.token;
      await this.jwtService.verify(token);
      const conversations =
        await this.conversationsService.getConversation(currentUserId);
      client.emit('conversation', conversations);
    } catch (error) {
      console.log('error 3', error);
      this.server.emit('auth-error', error.message);
    }
  }

  @SubscribeMessage('seen')
  async handleSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() msgByUserId: string,
  ): Promise<void> {
    try {
      console.log('4', msgByUserId);
      const token =
        client.handshake.auth.token || client.handshake.headers.token;
      await this.jwtService.verify(token);
      const user = client['user'];
      const userId = user._id;

      await this.messagesService.markMessageAsSeen(userId, msgByUserId);

      const conversationSender =
        await this.conversationsService.getConversation(userId);
      const conversationReceiver =
        await this.conversationsService.getConversation(msgByUserId);

      this.server.to(userId).emit('conversation', conversationSender);
      this.server.to(msgByUserId).emit('conversation', conversationReceiver);
    } catch (error) {
      console.log('error 4', error);
      this.server.emit('auth-error', error.message);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client['user'];
    this.onlineUsers.delete(user?._id.toString());
    client.disconnect();
    this.logger.log(`Client disconnect ${client.id}`);
    this.server.emit('onlineUsers', Array.from(this.onlineUsers));
  }
}
