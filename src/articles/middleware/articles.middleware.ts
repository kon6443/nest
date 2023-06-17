import { Request, Response, NextFunction } from 'express';

export class ArticleMiddleware {
    static middlewareExample() {
        console.log('This is a middleware.');
    }
}

