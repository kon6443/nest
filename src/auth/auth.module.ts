import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { config } from '../../config/config';

@Module({
    imports: [ 
        JwtModule.register({ 
            secret: config.JWT.SECRET, 
            signOptions: { expiresIn: '1h' },
        }) 
    ],
    providers: [AuthService, AuthGuard ], 
    exports: [ JwtModule, AuthService, AuthGuard ], 
})
export class AuthModule {}
