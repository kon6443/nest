import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';

import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [ SharedModule, AuthModule ],
    controllers: [ArticlesController],
    providers: [ArticlesService]
})
export class ArticlesModule {}
