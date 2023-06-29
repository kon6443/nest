import { Controller, Get, Post, Body,  HttpCode, HttpStatus, HttpException,  Req, Res  } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';

import { CreateUserDto } from './dto/create-user.dto';
import { ReadUserDto } from './dto/read-user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly serviceInstance: UserService) {}

    @Post('new')
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostNewUser(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
        try {
            createUserDto = await this.serviceInstance.priorProcess(createUserDto);
            const res = await this.serviceInstance.createNewUser(createUserDto);
            if(res.affectedRows!==1) {
                throw new HttpException('Failed to create a new account.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return { message: 'Your account has been created.' }; 
        } catch(err) {
            throw new Error(err);
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK) // Set the HTTP status code to 200 okay.
    async handlePostLogin(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
        try {
            const readUserDto: ReadUserDto = await this.serviceInstance.findUserById(createUserDto);
            console.log('readUserDto:', readUserDto);
            const invalidPassword = await this.serviceInstance.authenticateUser(createUserDto.pw, readUserDto.password);
            /*
            if(invalidPassword) {
                throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
            }
            */
            const jwt = this.serviceInstance.issueJWT();
            console.log('jwt:', jwt);
            return { message: 'jwt should be returned.' };
        } catch(err) {
            throw new Error(err);
        }
    }
    
    @Get()
    handleGetUserPage(@Res() res: Response): void {
        try {
            const user = '';
            // if(user) {

            // }
            res.sendFile('loginFormat.html', { root: 'public/user' });
        } catch(err) {
            throw new Error(err);
        }
    }
}

