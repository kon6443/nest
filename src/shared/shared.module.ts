import { Module } from '@nestjs/common';
import { MySQLRepository } from './mysql.repository';

@Module({
    imports: [],
    providers: [ MySQLRepository ],
    exports: [ MySQLRepository ], 
})
export class SharedModule {}
