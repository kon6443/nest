import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express'; 
import * as path from 'path'; 

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Set the static file serving.
    app.use(express.static(path.join(__dirname, '..', 'public')));

    await app.listen(3000);
}
bootstrap();
