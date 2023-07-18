import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ArticlesModule } from './articles/articles.module';
import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [ArticlesModule, UserModule, SharedModule, AuthModule, ChatModule, WebsocketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
