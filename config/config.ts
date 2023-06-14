// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
import { path } from 'path';
import dotenv from 'dotenv';

// Load the .env file
dotenv.config();

/**
 * Reason why to use both config.js and .env file is to use auto complete feature.
 * And config is manipulated by registering into a container.
 */
export const config = {

    // MySQL DB connection
    MYSQL: {
        // HOST: process.env.SQL_HOST,
        USER: process.env.SQL_USER,
        PASSWORD: process.env.SQL_PASSWORD,
        DATABASE: process.env.MYSQL_DATABASE,
        ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD
    }

};

