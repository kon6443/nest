import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ArticlesModule } from './articles/articles.module';
import { UserModule } from './user/user.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [ArticlesModule, UserModule, SharedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
