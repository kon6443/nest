import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { ReadUserDto } from '../user/dto/read-user.dto';

@Injectable()
export class AuthGuard implements CanActivate { 
    constructor( 
        private readonly authService: AuthService 
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const jwt = req.cookies.jwt;
        if(!jwt) {
            throw new UnauthorizedException('Missing JWT token.');
        } else {
            return true;
        }
    }
}
