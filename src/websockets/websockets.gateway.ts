import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ namespace: '/chat' })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private userMap: Map<string, string>;
    constructor( 
        private readonly chatService: ChatService, 
        private readonly authService: AuthService, 
    ) { this.userMap = new Map<string, string>(); }

    // Helper function to parse cookies from the cookie header.
    private parseCookies(cookieHeader: string): { [key: string]: string  } {
        const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
        const cookieMap: { [key: string]: string  } = {};
    
        cookies.forEach((cookie) => {
            const [name, value] = cookie.split('=');
                cookieMap[name] = value;
        });
        return cookieMap;
    }

    // WebSocket event handlers and business logic
    
    async handleConnection(client: Socket) {
        const cookies = this.parseCookies(client.handshake.headers.cookie);
        const {id: userId} = await this.authService.verifyToken(cookies['jwt']);
        this.userMap.set(client.id, userId);

        const announcement = `${this.userMap.get(client.id)} has entered the chat room.`;
        console.log(announcement);
        this.server.emit('chat', { announcement: announcement} );
    }

    handleDisconnect(client: Socket) {
        const announcement = `${this.userMap.get(client.id)} has left the chatroom.`;
        console.log(announcement);
        this.server.emit('chat', { announcement: announcement} );
    }

    @SubscribeMessage('chat')
    async handleMessage(client: Socket, payload: { message: string }) {
        this.server.emit('chat', { userId: this.userMap.get(client.id), id: client.id, message: payload.message });

        if(this.chatService.isCommand(payload.message)) {
            const chatBotMessage = await this.chatService.executeCommand(payload.message, 'two');
            this.server.emit('chat', { id: 'chatBot', message: chatBotMessage });
        }
    }

}

