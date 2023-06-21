import { Controller, Get, Post, Delete, Put, HttpCode, Req, Res, Param, ParseIntPipe, Body, HttpStatus, HttpException, Render } from '@nestjs/common';
import { Request, Response } from 'express';
import { ArticlesService } from './articles.service';

import { CreateArticleDto } from './dto/create-article.dto';
import { GetArticleDto } from './dto/get-article.dto';
import { PutArticleDto } from './dto/put-article.dto';
import { DeleteArticleDto } from './dto/delete-article.dto';

import { GetCommentDto } from './dto/get-comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

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
    async handlePostArticle(@Body() createArticleDto: CreateArticleDto): Promise<{message: string, id: number}> {
        try {
            createArticleDto.author = 'one'; 
            const res = await this.serviceInstance.postArticle(createArticleDto);
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
    async handleDeleteArticle(@Body() deleteArticleDto: DeleteArticleDto): Promise<void> {
        try {
            const affectedRows = await this.serviceInstance.deleteArticle(deleteArticleDto);
            if(affectedRows!==1) {
                throw new HttpException('Failed to delete the article.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Update the article.
     */
    @Put(':id')
    async handlePutArticle(@Param('id') id, @Body() putArticleDto: PutArticleDto): Promise<{message: string}> {
        try {
            const changedRows = await this.serviceInstance.putArticle(id, putArticleDto);
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

    /**
     * Post a comment.
     */
    @Post(':id')
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostComment(@Param('id') id, @Body() createCommentDto: CreateCommentDto): Promise<{ message: string }> {
        try {
            createCommentDto.author = 'one';
            const insertId = await this.serviceInstance.postComment(id, createCommentDto);
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

    /**
     * Delete the comment.
     */
    @Delete(':id/:depth')
    @HttpCode(HttpStatus.NO_CONTENT) // Set the HTTP status code to 204 No Content
    async handleDeleteComment(@Param('id') id, @Param('depth', ParseIntPipe) depth: number): Promise<{ message: string }> {
        try {
            const affectedRows = await this.serviceInstance.deleteCommentById(id, depth);
            if(affectedRows!==1) {
                throw new HttpException('Failed to delete the comment.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return { message: 'Comment has been deleted.' }
        } catch(err) {
            throw new Error(err);
        }
    }

}
