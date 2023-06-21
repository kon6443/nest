import { Controller, Get, Post, Delete, Put, HttpCode, Req, Res, Param, Body, HttpStatus, HttpException, Render } from '@nestjs/common';
import { Request, Response } from 'express';
import { ArticlesService } from './articles.service';
import { GetArticleDto } from './dto/get-article.dto';
import { GetCommentDto } from './dto/get-comment.dto';

@Controller('articles')
export class ArticlesController {

    constructor(private readonly serviceInstance: ArticlesService) {}

    /**
     * Display main page of articles.
     */
    @Get()
    @Render('articleMain')
    async handleGetMain(@Req() { query }: Request): Promise<{ articles: GetArticleDto[], pagination: any }> {
        try {
            const { title, 'current-page': currentPage, 'items-per-page': itemsPerPage } = query;
            const { articles, pagination }: { articles: GetArticleDto[], pagination: any } = await this.serviceInstance.getMainPageItems(title, currentPage, itemsPerPage);
            return { articles, pagination };
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Display article writing format.
     */
    @Get('article-format')
    handleGetArticleFormat(@Res() res: Response): void {
        try {
            res.sendFile('articleFormat.html', { root: 'public/articles' });
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Save an article.
     */
    @Post('article')
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostArticle(@Body() body): Promise<{message: string, id: number}> {
        try {
            const { title, content } = body;
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
    
    /**
     * Delete the article.
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Set the HTTP status code to 204 No Content
    async handleDeleteArticle(@Body() body): Promise<void> {
        try {
            const { id, author } = body;
            const affectedRows = await this.serviceInstance.deleteArticle(id, author);
            if(affectedRows!==1) {
                throw new HttpException('Failed to delete the article.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch(err) {
            throw new Error(err);
        }
    }

    @Put(':id')
    async handlePutArticle(@Param('id') id, @Body() body): Promise<{message: string}> {
        try {
            const { title, content } = body;
            const changedRows = await this.serviceInstance.putArticle(id, title, content);
            if(changedRows!==1) {
                throw new HttpException('Failed to edit the article.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return { message: 'Article has been updated.'};
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Display article editing format.
     */
    @Get(':id/edit')
    @HttpCode(HttpStatus.OK) // Set the response status code to 200 OK
    @Render('articles/editingArticleFormat') // /views/articles/editingArticleFormat.ejs
    async handleGetEditingArticleFormat(@Param('id') id, @Req() { query }: Request): Promise<{ article: GetArticleDto }> {
        try {
            const { user } = query;
            const doesUserMatch = await this.serviceInstance.confirmArticleAuthor(id, user);
            if(!doesUserMatch) {
                throw new HttpException('You are not authorized to edit this article.', HttpStatus.FORBIDDEN);
            }
            const article: GetArticleDto = await this.serviceInstance.getArticleById(id);
            return { article };
        } catch(err) {
            console.error(err);
            throw new Error(err);
        }
    }

    /**
     * Display an article.
     */
    @Get(':id')
    @Render('articles/article') // /views/articles/article.ejs
    async handleGetArticle(@Param('id') id): Promise<{ article: GetArticleDto, comments: GetCommentDto[] }> {
        try {
            const article:  GetArticleDto = await this.serviceInstance.getArticleById(id);
            const comments: GetCommentDto[] = await this.serviceInstance.getCommentsByArticleId(id);
            return { article, comments };
        } catch(err) {
            throw new Error(err);
        }
    }

    @Post(':id')
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostComment(@Param('id') id, @Body() body): Promise<{ message: string }> {
        try {
            const {  content } = body;
            const author = 'one';
            const insertId = await this.serviceInstance.postComment(id, author, content);
            if(insertId<=0) {
                throw new HttpException('Failed to comment.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return {
                message: 'Comment has been posted.'
            }
        } catch(err) {
            throw new Error(err);
        }
    }

    /*
    @Post(':id')
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostReply(@Param('id') id, @Body() body): Promise<void> {
        try {
            const { author, content } = body;
            const insertId = await this.serviceInstance.postReply(id, author, content);
            if(insertId<=0) {
                throw new HttpException('Failed to comment.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch(err) {
            throw new Error(err);
        }
    }
    */

}
