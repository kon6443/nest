import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express'; 

@Controller()
export class AppController {

    constructor(private readonly appService: AppService) {}

    @Get()
    getMain(@Res() res: Response): void {
        res.status(HttpStatus.OK).sendFile('home.html', { root: 'public/' });
    }
}
