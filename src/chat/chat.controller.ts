import { Controller, Req, Res, Get, Post, Param, Render, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
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

    // Handles displaying a main page, including all created rooms.
    @Get()
    @Render('chat/rooms')
    async handleGetChatMain() {
    }

    // Handles creating a new room.
    @Post('/:roomName')
    @UseGuards(AuthGuard)
    handlePostRoom(@Param('roomName') roomName): { message: string } {
        const errorFlag = this.chatService.createRoom(roomName);
        if(errorFlag) 
            throw new HttpException({message: `${roomName} already exists.`}, HttpStatus.CONFLICT);
        return { message: `${roomName} has been created.` };
    }

    // Handles displaying a created chat room.
    @Get('/:roomName')
    @UseGuards(AuthGuard)
    @Render('chat/chat')
    async handleGetMain(@Req() req: Request, @Param('roomName') roomName, @Res() res: Response) {
        const isRoomValid = this.chatService.isRoomValid(roomName);
        if(!isRoomValid) {
            return res.status(HttpStatus.NOT_FOUND).json({ error: `${roomName} has not been created.` });
        }
        const user = await this.authService.verifyToken(req.cookies.jwt);
        return { user, roomName };
    }

}

