import { Controller, Get, Req, Res, Param, ParseIntPipe, HttpStatus, Render } from '@nestjs/common';
import { Request, Response } from 'express';
import { ArticlesService } from './articles.service';
import { GetArticlesDTO } from './dto/get-articles.dto';

@Controller('articles')
export class ArticlesController {

    constructor(private readonly serviceInstance: ArticlesService) {}

    @Get()
    @Render('articleMain')
    async handleGetMain(@Req() { query }: Request): Promise<{ articles: GetArticlesDTO[], pagination: any }> {
        try {
            const { title, 'current-page': currentPage, 'items-per-page': itemsPerPage }: { title?: string, 'current-page'?: number, 'items-per-page'?: number } = query;
            const { articles, pagination }: { articles: GetArticlesDTO[], pagination: any } = await this.serviceInstance.getMainPageItems(title, currentPage, itemsPerPage);
            return { articles, pagination };
        } catch(err) {
            throw new Error(err);
        }

    }

    @Get(':id')
    @Render('articles/article')
    async handleGetPracticeReqObject(@Param('id', ParseIntPipe) id: number): Promise<{ article: GetArticlesDTO }> {
        try {
            const article: GetArticlesDTO = await this.serviceInstance.getArticleById(id);
            console.log('article:', article);
            return { article };
        } catch(err) {
            throw new Error(err);
        }
    }

}
