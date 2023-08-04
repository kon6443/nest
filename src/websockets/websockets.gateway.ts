import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ namespace: '/chat' })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private activeUsers = new Map<string, string>(); // socketId -> userId
    constructor( 
        private readonly chatService: ChatService, 
        private readonly authService: AuthService, 
    ) {}

    // Helper function to parse cookies from the cookie header.
    private extractJwtFromCookies(client: Socket): string|undefined {
        const cookieHeader = client.handshake.headers.cookie;
        if(!cookieHeader) {
            return undefined;
        }

        const cookies = cookieHeader ? cookieHeader.split(';').map((cookie) => cookie.trim()) : [];
        const jwtCookie = cookies.find((cookie) => cookie.startsWith('jwt='))?.split('=')[1];

        return jwtCookie;
    }
    
    // This is when a new user enters a chat room. 
    async handleConnection(client: Socket) {
        const jwtCookie = this.extractJwtFromCookies(client);
        if(!jwtCookie) {
            console.log('jwt is rquired to enter.');
            return;
        }

        const {id: userId} = await this.authService.verifyToken(jwtCookie);
        this.activeUsers.set(client.id, userId);

        const announcement = `${this.activeUsers.get(client.id)} has entered the chat room.`;
        console.log(announcement);

        this.server.emit('chat', { userId: 'announcement', message: announcement} );
        this.server.emit('user-status', { activeUsers: Array.from(this.activeUsers) });

    }

    handleDisconnect(client: Socket) {
        const announcement = `${this.activeUsers.get(client.id)} has left the chatroom.`;
        console.log(announcement);
        this.activeUsers.delete(client.id);
        this.server.emit('chat', { userId: 'announcement',  message: announcement} );
        this.server.emit('user-status', { activeUsers: Array.from(this.activeUsers )});
    }

    @SubscribeMessage('chat')
    async handleMessage(client: Socket, payload: { message: string }) {
        this.server.emit('chat', { userId: this.activeUsers.get(client.id), id: client.id, message: payload.message });
        
        const chatBotMessage = await this.chatService.handleChatCommand(payload.message, this.activeUsers.get(client.id));
        if(chatBotMessage) {
            this.server.emit('chat-bot', { userId: 'Chat bot', message: chatBotMessage });
        }
    }

}

