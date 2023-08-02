import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [ AuthModule, SharedModule, HttpModule ],
    controllers: [ChatController],
    providers: [ChatService], 
    exports: [ChatService],
})
export class ChatModule {}
