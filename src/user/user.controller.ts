import { Controller, Get, Post, Delete, Body,  HttpCode, HttpStatus, HttpException,  Req, Res, Render } from '@nestjs/common';
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
            const readUserDto: ReadUserDto = await this.serviceInstance.findUserById(createUserDto.id);
            await this.serviceInstance.authenticateUser(createUserDto.pw, readUserDto.password);
            const jwt = await this.serviceInstance.issueJWT(readUserDto.id);
            res.cookie('jwt', jwt, {maxAge: 60*60 * 1000});
            return res.json({ message: 'jwt', status: HttpStatus.OK});
        } catch(err) {
            throw new Error(err);
        }
    }
    
    @Get()
    async handleGetUserPage(@Req() req: Request, @Res() res: Response): Promise<any> {
        try {
            let jwt = req.cookies.jwt;
            if(jwt) {
                const readUserDto: ReadUserDto = await this.serviceInstance.getUserInfo(jwt);
                return res.render('user/user', { user: readUserDto });
            } else {
                return res.sendFile('loginFormat.html', { root: 'public/user' });
            }
        } catch(err) {
            throw new Error(err);
        }
    }

    @Delete('logout')
    @HttpCode(HttpStatus.NO_CONTENT) // Set the HTTP status code to 204 No Content
    async handleDeleteLogOut(@Res() res: Response) {
        try {
            return res.clearCookie('jwt').end();
        } catch(err) {
            throw new Error(err);
        }
    }

}

