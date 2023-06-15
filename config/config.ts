import * as dotenv from 'dotenv';
import * as path from 'path';

const envFilePath = path.resolve(__dirname, '../../config/.env');

// Load the .env file
dotenv.config({path: envFilePath});

/**
 * Reason why to use both config.js and .env file is to use auto complete feature.
 * And config is manipulated by registering into a container.
 */
export const config = {
    // MySQL DB connection
    MYSQL: {
        HOST: process.env.MYSQL_HOST,
        USER: process.env.MYSQL_USER,
        PASSWORD: process.env.MYSQL_PASSWORD,
        DATABASE: process.env.MYSQL_DATABASE,
        ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD
    }
};

