import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // WebSocket event handlers and business logic
    
    handleConnection(client: Socket) {
        console.log(`${client.id} has entered the chat room.`);
    }

    handleDisconnect(client: Socket) {
        console.log(`${client.id} has left the chatroom.`);
    }

}

