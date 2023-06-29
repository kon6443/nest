import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

import { SharedModule } from '../shared/shared.module';

@Module({
    imports: [ SharedModule ],
    controllers: [ArticlesController],
    providers: [ArticlesService]
})
export class ArticlesModule {}
