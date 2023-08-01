/**
 * mysql.repository.ts
 */

import { Injectable } from '@nestjs/common';
import { createPool, Pool } from 'mysql2/promise';
import { config } from '../../config/config';

@Injectable()
export class MySQLRepository {
    private pool: Pool;

    constructor() {
        console.log('MySQL has been connected...');
        this.pool = createPool({
            connectionLimit: 10,
            host: config.MYSQL.HOST,
            user: config.MYSQL.USER,
            password: config.MYSQL.PASSWORD,
            database: config.MYSQL.DATABASE 
        });
    }

    async executeQuery(sql: string, values?: any) {
        let connection: any | null = null;
        let res = null;
        try {
            connection = await this.pool.getConnection();
            [res] = await connection.query(sql, values);
            return res;
        } catch(err) {
            console.error('err:', err);
            throw err;
            // throw new Error(err);
        } finally {
            if(connection) {
                connection.release();
            }
        }
    }
}

