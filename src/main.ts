import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

import * as express from 'express'; 
import * as path from 'path'; 

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Set the static file serving.
    app.use('/public', express.static(path.join(__dirname, '../..', 'public')));

    app.setViewEngine('ejs');
    app.setBaseViewsDir(path.join(__dirname, '../..', 'views')); // Set the directory where your views/templates are located

    await app.listen(3000);
}
bootstrap();
