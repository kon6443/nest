import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { ChatModule } from '../chat/chat.module';

@Module({ 
    imports: [ ChatModule ], 
    providers: [ WebsocketsGateway ], 
})

export class WebsocketsModule {}

