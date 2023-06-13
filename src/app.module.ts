import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ForumModule } from './forum/forum.module';

@Module({
  imports: [ForumModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
