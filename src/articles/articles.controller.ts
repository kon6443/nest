import { Controller, Get, Post, Delete,  Req, Res, Param, Body, ParseIntPipe, HttpStatus, Render } from '@nestjs/common';
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

    @Get('article-format')
    handleGetArticleFormat(@Res() res: Response): void {
        try {
            res.sendFile('articleFormat.html', { root: 'public/articles' });
        } catch(err) {
            throw new Error(err);
        }
    }

    @Post('article')
    async handlePostArticle(@Body() body: any): Promise<string> {
        try {
            console.log('handlePostArticle.');
            const { title, content }: { title: string, content: string } = body;
            const author = 'one';
            const affectedRows = await this.serviceInstance.postArticle(author, title, content);
            if(affectedRows===1) {
                return 'Article has been posted.'
            } else {
                throw new Error('Something went wrong.');
            }
        } catch(err) {
            throw new Error(err);
        }
    }
    
    @Delete(':id')
    async handleDeleteArticle(@Body() body: any): Promise<string> {
        try {
            const { id, author }: { id: number, author: string } = body;
            console.log('id:', id);
            console.log('author:', author);
            const affectedRows = await this.serviceInstance.deleteArticle(id, author);
            console.log('affectedRows:', affectedRows);
            if(affectedRows===1) {
                return 'Article has been deleted.'
            } else {
                throw new Error('Something went wrong.');
            }
        } catch(err) {
            throw new Error(err);
        }
    }

    @Get(':id')
    @Render('articles/article')
    async handleGetArticle(@Param('id', ParseIntPipe) id: number): Promise<{ article: GetArticlesDTO }> {
        try {
            const article: GetArticlesDTO = await this.serviceInstance.getArticleById(id);
            return { article };
        } catch(err) {
            throw new Error(err);
        }
    }

}
