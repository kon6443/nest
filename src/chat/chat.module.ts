import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule, SharedModule],
    controllers: [ChatController],
    providers: [ChatService], 
    exports: [ChatService],
})
export class ChatModule {}
