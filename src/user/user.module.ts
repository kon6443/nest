import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

import { UserController } from './user.controller';
import { UserService } from './user.service';


@Module({
    imports: [ SharedModule, AuthModule ],
    controllers: [UserController],
    providers: [UserService], 
})
export class UserModule {}
