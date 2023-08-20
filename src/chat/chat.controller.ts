import { Controller, Req, Get, Post, Param, Render, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';

import { AuthGuard } from '../auth/auth.guard';

@Controller('chat')
export class ChatController { 

    constructor(
        private readonly authService: AuthService, 
        private readonly chatService: ChatService
    ) {}

    @Get()
    @Render('chat/rooms')
    async handleGetRooms() {
    }

    @Post('/:roomName')
    handlePostRoom(@Param('roomName') roomName): { message: string } {
        const message = this.chatService.createRoom(roomName);
        return { message: message };
    }

    @Get('/:roomName')
    @UseGuards(AuthGuard)
    @Render('chat/chat')
    async handleGetMain(@Req() req: Request, @Param('roomName') roomName) {
        console.log('handleGetMain:', roomName);
        const user = await this.authService.verifyToken(req.cookies.jwt);
        const isRoomValid = await this.chatService.isRoomValid(roomName);
        console.log(this.chatService.getRoomStatus);
        if(!isRoomValid) {
            // Handle regarding process.
            console.log('no romm');
            return { message: `${roomName} has not been created.`};
        }
        return { user, roomName };
    }

}

