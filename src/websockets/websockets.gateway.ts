import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({ namespace: '/chat' })
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private activeUsers = new Map<string, string>(); //  <socketId -> userId> 
    private intervalId = undefined;
    private rooms: Set<string> = new Set();
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
        // Chekcs if a user is valid or not.
        /*
        const jwtCookie = this.extractJwtFromCookies(client);
        if(!jwtCookie) {
            return;
        }

        const {id: userId} = await this.authService.verifyToken(jwtCookie);
        console.log('userId:', userId);
        this.activeUsers.set(client.id, userId);

        this.toggleAutoAnnouncement();

        const announcement = `${this.activeUsers.get(client.id)} has entered the chat room.`;
        this.server.emit('chat', { userId: 'announcement', message: announcement} );
        */
        // this.server.emit('user-status', { activeUsers: Array.from(this.activeUsers) });
    }

    handleDisconnect(client: Socket) {
        console.log('check');
        const userId = this.chatService.getUser(client.id);
        this.chatService.leaveRoom(userId);
        const announcement = `${userId} has left the chatroom.`;
        this.chatService.leaveRoom(userId);
        // this.activeUsers.delete(client.id);
        this.server.emit('chat', { userId: 'announcement',  message: announcement} );
        this.server.emit('user-status', { activeUsers: Array.from(this.activeUsers )});
        this.toggleAutoAnnouncement();
    }

    @SubscribeMessage('chat')
    async handleMessage(client: Socket, payload: { message: string, roomName: string }) {
        console.log('payload:', payload);
        console.log('roomstatus:', this.chatService.getRoomStatus());
        // client.broadcast.to(payload.roomName).emit('chat', { userId: this.activeUsers.get(client.id), id: client.id, message: payload.message });
        this.server.to(payload.roomName).emit('chat', { userId: this.activeUsers.get(client.id), id: client.id, message: payload.message });
        // this.server.emit('chat', { userId: this.activeUsers.get(client.id), id: client.id, message: payload.message });
        
        const chatBotMessage = await this.chatService.handleChatCommand(payload.message, this.activeUsers.get(client.id));
        if(chatBotMessage) {
            this.server.emit('chat-bot', { userId: 'Chat bot', message: chatBotMessage });
        }
    }

    @SubscribeMessage('user-enter')
    async handleUserEnter(client: Socket, roomName: string) {
        console.log('user-enter');

        // Chekcs if the user is valid or not.
        const jwtCookie = this.extractJwtFromCookies(client);
        if(!jwtCookie) return;

        if(!this.chatService.isRoomValid(roomName)) {
            // Handle when there is no valid matching room.
        }

        // Checks if the room is valid and if so, enter the room.
        // if(this.chatService.isRoomValid(roomName)) {
        //     const userStatus = this.chatService.enterRoom(roomName, client.id);
        //     console.log(userStatus);
        //     this.server.emit('user-status', { activeUsers: userStatus});
        // }

        const {id: userId} = await this.authService.verifyToken(jwtCookie);
        this.chatService.setUser(client.id, userId);
        // this.activeUsers.set(client.id, userId);

        const activeUsers = this.chatService.enterRoom(roomName, this.chatService.getUser(client.id));
        console.log(activeUsers);
        this.server.emit('user-status', { activeUsers: activeUsers});

        this.toggleAutoAnnouncement();

        const announcement = `${this.chatService.getUser(client.id)} has entered the chat room.`;
        this.server.emit('chat', { userId: 'announcement', message: announcement} );

    }

    @SubscribeMessage('room-status')
    async handleRoomStatus() {
        this.server.emit('room-status', this.chatService.getRoomStatus());
    }


}

