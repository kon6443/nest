import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ReadUserDto } from './dto/read-user.dto';

import { NotFoundException } from '../shared/exceptions/custom.NotFoundException';

import { MySQLRepository } from '../shared/mysql.repository';

import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

    constructor(private readonly repositoryInstance: MySQLRepository) {}

    checkValidation(createUserDto: CreateUserDto) {
        const isInvalidId = '';
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
                return `${fields[field]} is required.`;
            }
        }
        if(createUserDto.pw!==createUserDto.pwc) {
            return `Password and password confirmation is not matched.`;
        }
        return isInvalidId;
    }

    async encryptPassword(password): Promise<string> {
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        password = await bcrypt.hash(password, salt);
        return password;
    }

    async checkDuplicatedId(createUserDto: CreateUserDto): Promise<number> {
        const sql = `SELECT COUNT(id) AS count FROM Users WHERE id = ?`;
        const values = [ createUserDto.id ];
        const [res] = await this.repositoryInstance.executeQuery(sql, values);
        return res.count;
    }

    async priorProcess(createUserDto: CreateUserDto): Promise<CreateUserDto> {
        const invalidId = this.checkValidation(createUserDto);
        if(invalidId) {
            throw new Error(invalidId);
        }
        const duplicatedId = await this.checkDuplicatedId(createUserDto);
        if(duplicatedId) {
            throw new Error(`${createUserDto.id} is already taken.`);
        }
        createUserDto.pw = await this.encryptPassword(createUserDto.pw);
        return createUserDto;
    }

    async createNewUser(createUserDto: CreateUserDto): Promise<any> {
        const sql = `INSERT INTO Users (id, name, password, address, phone_number) VALUES (?);`;
        const values = [ [ createUserDto.id, createUserDto.name, createUserDto.pw, createUserDto.address, createUserDto.phone_number ] ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        return res;
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
        console.log('userTypedPassword:', userTypedPassword);
        console.log('encryptedPassword:', encryptedPassword);
        const notAuthenticated = !(await bcrypt.compare(userTypedPassword, encryptedPassword));
        if(notAuthenticated) {
            throw new HttpException('', HttpStatus.UNAUTHORIZED);
        }
    }

    issueJWT() {
        console.log('Hello from issueJWT() method.');
    }

}
