import { Controller, Get, Post, Body,  HttpCode, HttpStatus, HttpException,  Req, Res, Render } from '@nestjs/common';
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
            await this.serviceInstance.createNewUser(createUserDto);
            return { message: 'Your account has been created.' }; 
        } catch(err) {
            throw new Error(err);
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK) // Set the HTTP status code to 200 okay.
    async handlePostIssueJWT(@Body() createUserDto: CreateUserDto, @Res() res: Response): Promise<any> {
        try {
            console.log('this');
            const readUserDto: ReadUserDto = await this.serviceInstance.findUserById(createUserDto);
            await this.serviceInstance.authenticateUser(createUserDto.pw, readUserDto.password);
            const jwt = await this.serviceInstance.issueJWT(readUserDto.id);
            console.log('jwt:', jwt);
            res.cookie('jwt', jwt, {maxAge: 60*60 * 1000});
            return res.json({ message: 'jwt', status: HttpStatus.OK});
        } catch(err) {
            throw new Error(err);
        }
    }
    
    @Get()
    @Render('user/user')
    handleGetUserPage(@Req() req: Request, @Res() res: Response): void {
        try {
            let user = req.cookies.jwt;
            console.log('user:', user);
            if(user) {
                console.log('1');
            } else {
                console.log('2');
                res.sendFile('loginFormat.html', { root: 'public/user' });
            }
        } catch(err) {
            throw new Error(err);
        }
    }
}

