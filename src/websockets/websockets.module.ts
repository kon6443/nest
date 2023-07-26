import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { ChatModule } from '../chat/chat.module';
import { AuthModule } from '../auth/auth.module';

@Module({ 
    imports: [ ChatModule, AuthModule ], 
    providers: [ WebsocketsGateway ], 
})

export class WebsocketsModule {}

