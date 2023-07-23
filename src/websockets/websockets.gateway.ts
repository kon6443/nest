import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';

@WebSocketGateway({ namespace: '/chat' })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    constructor(private readonly chatService: ChatService) {}

    // WebSocket event handlers and business logic
    
    handleConnection(client: Socket) {
        const announcement = `${client.id} has entered the chat room.`;
        console.log(announcement);
        // console.log(client.handshake.headers.cookie.substr(4));
        this.server.emit('chat', { announcement: announcement} );
    }

    handleDisconnect(client: Socket) {
        const announcement = `${client.id} has left the chatroom.`;
        console.log(announcement);
        this.server.emit('chat', { announcement: announcement} );
    }

    @SubscribeMessage('chat')
    async handleMessage(client: Socket, message: string) {
        // console.log('client:', client.id);
        // console.log('message:', message);
        console.log(`${client.id}: ${message}`);
        // this.server.emit('chat', message);
        
        this.server.emit('chat', { id: client.id, message: message });

        if(this.chatService.isCommand(message)) {
            const chatBotMessage = await this.chatService.executeCommand(message, 'two');
            this.server.emit('chat', { id: 'chatBot', message: chatBotMessage });
        }
    }

}

