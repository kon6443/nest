import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ReadUserDto } from './dto/read-user.dto';

import { NotFoundException } from '../shared/exceptions/custom.NotFoundException';
import { config } from '../../config/config';
import { MySQLRepository } from '../shared/mysql.repository';
import { AuthService } from '../auth/auth.service';

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserService {

    constructor(private readonly repositoryInstance: MySQLRepository, 
                private readonly authService: AuthService
    ) {}

    checkValidation(createUserDto: CreateUserDto) {
        const fields: { [key: string]: string } = {
            id: 'ID',
            name: 'Name',
            pw: 'Password',
            pwc: 'Password confirmation', 
            address: 'Address',
            phone_number: 'Phone number'
        }
        for(const field of Object.keys(fields)) {
            if(!createUserDto[field] || createUserDto[field].trim().length===0) {
                throw new Error(`${fields[field]} is required.`);
            }
        }
        if(createUserDto.pw!==createUserDto.pwc) {
            throw new Error(`Password and password confirmation is not matched.`);
        }
    }

    async encryptPassword(password): Promise<string> {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        password = await bcrypt.hash(password, salt);
        return password;
    }

    async checkDuplicatedId(createUserDto: CreateUserDto) {
        const sql = `SELECT COUNT(id) AS count FROM Users WHERE id = ?`;
        const values = [ createUserDto.id ];
        const [res] = await this.repositoryInstance.executeQuery(sql, values);
        if(res.count) {
            throw new Error(`${createUserDto.id} is already taken.`);
        }
    }

    async priorProcess(createUserDto: CreateUserDto): Promise<CreateUserDto> {
        this.checkValidation(createUserDto);
        await this.checkDuplicatedId(createUserDto);
        createUserDto.pw = await this.encryptPassword(createUserDto.pw);
        return createUserDto;
    }

    async createNewUser(createUserDto: CreateUserDto) {
        const sql = `INSERT INTO Users (id, name, password, address, phone_number) VALUES (?);`;
        const values = [ [ createUserDto.id, createUserDto.name, createUserDto.pw, createUserDto.address, createUserDto.phone_number ] ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows!==1) {
            throw new HttpException('Failed to create a new account.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async findUserById(createUserDto: CreateUserDto): Promise<ReadUserDto> {
        try {
            const sql = `SELECT * FROM Users WHERE id = ?;`;
            const values = [ createUserDto.id ];
            const readUserDto: ReadUserDto = await this.repositoryInstance.executeQuery(sql, values);
            if(!readUserDto[0]) {
                throw new NotFoundException('User not found.');
            }
            return readUserDto[0];
        } catch(err) {
            throw new HttpException('An error occurred while fetching user data.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async authenticateUser(userTypedPassword, encryptedPassword) {
        const notAuthenticated = !(await bcrypt.compare(userTypedPassword, encryptedPassword));
        if(notAuthenticated) {
            throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
    }

    async issueJWT(id): Promise<string> {
        const payload = { id };
        const token = await this.authService.signToken(payload); 
        return token;
    }

}
