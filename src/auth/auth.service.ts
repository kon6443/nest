import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    async signToken(payload): Promise<string> {
        return await this.jwtService.signAsync(payload);
    }

    async verifyToken(jwt): Promise<any> {
        return await this.jwtService.verifyAsync(jwt);
    }

}
