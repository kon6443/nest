import { Module } from '@nestjs/common';
// HttpModule
import { TransportController } from './transport.controller';
import { TransportService } from './transport.service';

@Module({
    // imports: [HttpModule], 
    imports: [], 
    controllers: [TransportController],
    providers: [TransportService]
})
export class TransportModule {}
