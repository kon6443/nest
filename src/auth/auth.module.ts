import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { config } from '../../config/config';

@Module({
    imports: [JwtModule.register({ 
        secret: config.JWT.SECRET, 
        signOptions: { expiresIn: '1h' },
    })],
    providers: [AuthService, JwtService], 
    exports: [JwtService], 
})
export class AuthModule {}
