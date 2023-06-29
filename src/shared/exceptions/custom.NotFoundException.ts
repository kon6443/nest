/**
 * custom.excepton.ts
 */

import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
    constructor(message) {
        // Set the HTTP status code to 400 bad request.
        super(message, HttpStatus.BAD_REQUEST);
    }
}

