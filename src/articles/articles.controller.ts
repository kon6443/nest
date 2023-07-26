import { Controller, Get, Post, Delete, Put, HttpCode, Req, Res, Param, ParseIntPipe, Body, HttpStatus, HttpException, Render, UseGuards, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { ArticlesService } from './articles.service';

import { CreateArticleDto } from './dto/create-article.dto';
import { GetArticleDto } from './dto/get-article.dto';
import { PutArticleDto } from './dto/put-article.dto';
import { DeleteArticleDto } from './dto/delete-article.dto';

import { GetCommentDto } from './dto/get-comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PutCommentDto } from './dto/put-comment.dto';

import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('articles')
export class ArticlesController {

    constructor( 
        private readonly serviceInstance: ArticlesService,
        private readonly authService: AuthService,
    ) {}

    /**
     * Save an article.
     */
    @Post('article')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostArticle(@Req() req: Request, @Body() createArticleDto: CreateArticleDto): Promise<{message: string, id: number}> {
        try {
            const jwt = req.cookies['jwt'];
            const payload = await this.authService.verifyToken(jwt);
            createArticleDto.author = payload.id; 
            const res = await this.serviceInstance.postArticle(createArticleDto);
            return {
                message: 'Article has been posted.',
                id: res.insertId 
            };
        } catch(err) {
            throw new Error(err);
        }
    }
    
    /**
     * Post a comment.
     */
    @Post(':id')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.CREATED) // Set the HTTP status code to 201 Created
    async handlePostComment(@Req() req: Request, @Param('id') id, @Body() createCommentDto: CreateCommentDto): Promise<{ message: string }> {
        try {
            const jwt = req.cookies['jwt'];
            const payload = await this.authService.verifyToken(jwt);
            createCommentDto.author = payload.id;
            const insertId = await this.serviceInstance.postComment(id, createCommentDto);
            return {
                message: 'Comment has been posted.'
            }
        } catch(err) {
            throw new Error(err);
        }
    }

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
    @UseGuards(AuthGuard)
    handleGetArticleFormat(@Res() res: Response): void {
        try {
            res.sendFile('articleFormat.html', { root: 'public/articles' });
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Display an article.
     */
    @Get(':id')
    @Render('articles/article') // /views/articles/article.ejs
    @UseGuards(AuthGuard)
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
     * Display article editing format.
     */
    @Get(':id/edit')
    @HttpCode(HttpStatus.OK) // Set the response status code to 200 OK
    @UseGuards(AuthGuard)
    @Render('articles/editingArticleFormat') // /views/articles/editingArticleFormat.ejs
    async handleGetEditingArticleFormat(@Param('id') id, @Req() req: Request, @Res() res: Response): Promise<{ article: GetArticleDto }> {
        try {
            const { user } = req.query;
            const jwt = req.cookies['jwt'];
            const payload = await this.authService.verifyToken(jwt);
            await this.serviceInstance.confirmArticleAuthor(id, payload.id);
            const article: GetArticleDto = await this.serviceInstance.getArticleById(id);
            return { article };
        } catch(err) {
            console.error(err);
            throw new Error(err);
        }
    }

    /* Authorize if user and comment's author matches.
     */
    @Get('comments/:id')
    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    async handleGetAuthorizeCommentAuthor(@Req() req: Request, @Param('id') id): Promise<{ message: string }> {
        try {
            const jwt = req.cookies['jwt'];
            const payload = await this.authService.verifyToken(jwt);
            await this.serviceInstance.confirmCommentAuthor(id, payload.id);
            return { message: 'Authorized.' }
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
            await this.serviceInstance.putArticle(id, putArticleDto);
            return { message: 'Article has been updated.'};
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Update the comment.
     */
    @Put('comments/:id')
    async handlePutComment(@Param('id') id, @Body() putCommentDto: PutCommentDto): Promise<{message: string}> {
        try {
            putCommentDto.comment_id = id;
            await this.serviceInstance.putComment(putCommentDto);
            return { message: 'Comment has been updated.'};
        } catch(err) {
            throw new Error(err);
        }
    }

    /**
     * Delete the article.
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) // Set the HTTP status code to 204 No Content
    async handleDeleteArticle(@Req() req: Request, @Param('id') id): Promise<void> {
        try {
            const jwt = req.cookies['jwt'];
            const payload = await this.authService.verifyToken(jwt);
            await this.serviceInstance.confirmArticleAuthor(id, payload.id);
            await this.serviceInstance.deleteArticle(id);
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
            await this.serviceInstance.deleteCommentById(id, depth);
            return { message: 'Comment has been deleted.' }
        } catch(err) {
            throw new Error(err);
        }
    }

}
