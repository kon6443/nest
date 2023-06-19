import { Controller, Get, Post, Delete, HttpCode, Req, Res, Param, Body, ParseIntPipe, HttpStatus, HttpException, Render } from '@nestjs/common';
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
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostArticle(@Body() body: any): Promise<{message: string, id: number}> {
        try {
            const { title, content }: { title: string, content: string } = body;
            const author = 'one';
            const res = await this.serviceInstance.postArticle(author, title, content);
            if(res.affectedRows!==1) {
                throw new HttpException('Failed to post the article.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return {
                message: 'Article has been posted.',
                id: res.insertId 
            };
        } catch(err) {
            throw new Error(err);
        }
    }
    
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Set the HTTP status code to 204 No Content
    async handleDeleteArticle(@Body() body: any): Promise<void> {
        try {
            const { id, author }: { id: number, author: string } = body;
            const affectedRows = await this.serviceInstance.deleteArticle(id, author);
            if(affectedRows!==1) {
                throw new HttpException('Failed to delete the article.', HttpStatus.INTERNAL_SERVER_ERROR);
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
