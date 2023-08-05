import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ namespace: '/chat' })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private activeUsers = new Map<string, string>(); // socketId -> userId
    private intervalId = undefined;
    private activeUserLogged = false;
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

    automate() {
        return setInterval(async () => {
            const chatBotMessage = await this.chatService.notifyNewUpdates()
            if(chatBotMessage) {
                this.server.emit('chat-bot', { userId: 'Chat bot', message: chatBotMessage });
            }
        }, 1000 * 60 * 2);
    }

    private toggleAutoAnnouncement() {
        if(this.activeUsers.size===1 && this.intervalId===undefined) {
            console.log('공지사항 자동 업데이트 기능을 시작합니다!');
            this.intervalId = this.automate();
        } else if(this.activeUsers.size===0 && this.intervalId) {
            console.log('공지사항 자동 업데이트 기능을 종료합니다!');
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    
    // This is when a new user enters a chat room. 
    async handleConnection(client: Socket) {
        const jwtCookie = this.extractJwtFromCookies(client);
        if(!jwtCookie) {
            return;
        }

        const {id: userId} = await this.authService.verifyToken(jwtCookie);
        this.activeUsers.set(client.id, userId);

        this.toggleAutoAnnouncement();

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
        this.toggleAutoAnnouncement();
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

