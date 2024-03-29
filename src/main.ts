import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as socketio from 'socket.io';

import * as express from 'express'; 
import * as path from 'path'; 

import * as cookieParser from 'cookie-parser';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Set the static file serving.
    app.use('/public', express.static(path.join(__dirname, '../..', 'public')));
    
    app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));
    
    app.setViewEngine('ejs');
    app.setBaseViewsDir(path.join(__dirname, '../..', 'views')); // Set the directory where your views/templates are located

    app.use(cookieParser());

    await app.listen(3000);
}
bootstrap();
