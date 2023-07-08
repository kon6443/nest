import { Module } from '@nestjs/common';
import { MySQLRepository } from './mysql.repository';
import { AuthGuard } from '../auth/auth.guard';

import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    providers: [ MySQLRepository, AuthGuard ],
    exports: [ MySQLRepository, AuthGuard ], 
})
export class SharedModule {}
