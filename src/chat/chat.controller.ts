import { Controller, Req, Get, Param, Render, UseGuards } from '@nestjs/common';
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


    @Get('/:roomName')
    @UseGuards(AuthGuard)
    @Render('chat/chat')
    async handleGetMain(@Req() req: Request, @Param('roomName') roomName) {
        console.log('roomName:', roomName);
        const user = await this.authService.verifyToken(req.cookies.jwt);
        return { user };
    }

}

