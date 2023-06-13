import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('forum')
export class ForumController {
    @Get()
    handleGetMain(): string {
        console.log('This is a main forum.');
        return 'This is a main page of the forum.';
    }

    @Get('req')
    handleGetPracticeReqObject(@Req() req: Request): string {
        console.log('req:', req);
        return 'practice request object.';
    }
}
