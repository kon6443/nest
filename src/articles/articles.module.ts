import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { MySQLRepository } from './articles.MySQLRepository';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, MySQLRepository]
})
export class ArticlesModule {}
