import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async signToken(payload): Promise<string> {
        return this.jwtService.signAsync(payload);
    }

    async verifyToken(jwt): Promise<any> {
        return this.jwtService.verifyAsync(jwt);
    }

}
