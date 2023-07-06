import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { MySQLRepository } from '../shared/mysql.repository';

import { CreateArticleDto } from './dto/create-article.dto';
import { GetArticleDto } from './dto/get-article.dto'; 
import { PutArticleDto } from './dto/put-article.dto';
import { DeleteArticleDto } from './dto/delete-article.dto';

import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentDto } from './dto/get-comment.dto';
import { PutCommentDto } from './dto/put-comment.dto';

@Injectable()
export class ArticlesService {

    constructor(private readonly repositoryInstance: MySQLRepository) {}

    /**
     * Validates query parameters.
     */
    validateQueries(title, currentPage, itemsPerPage) {
        title ??= '';
        currentPage = Number(currentPage) || 1;
        itemsPerPage = Number(itemsPerPage) || 10;
        return {
            title,
            currentPage,
            itemsPerPage
        };
    }

    getPaginationItems(numberOfArticles,  currentPage, itemsPerPage) {
        const totalPage = Math.ceil(numberOfArticles/itemsPerPage);
        currentPage = currentPage>totalPage ? 1 : currentPage;
        const startIndex = (currentPage-1) * itemsPerPage;
        const endIndex = (currentPage===totalPage) ? numberOfArticles-1 : (currentPage*itemsPerPage-1);
        const maxDisplayedPages = 10;

        let startPage, endPage;

        // Calculate the start and end page numbers based on the current page
        const offset = Math.floor((maxDisplayedPages-1) / 2);
        startPage = currentPage - offset;
        endPage = currentPage + offset;

        // Adjust the start and end page numbers if they go beyond the valid range
        if(startPage<1) {
            startPage = 1;
        }

        if(endPage>totalPage) {
            endPage = totalPage;
        }

        // Adjust the start and end page numbers if they don't cover the required range
        if(endPage-startPage+1 < maxDisplayedPages) {
            startPage = Math.max(1, endPage-maxDisplayedPages+1);
        }

        return {
            currentPage,
            itemsPerPage,
            totalPage,
            startIndex,
            endIndex,
            startPage,
            endPage
        }
    }

    /**
     * Get the number of matching articles by title via repository.
     */
    async readNumberOfArticlesByTitle(title): Promise<number> {
        const sql = `SELECT COUNT(article_id) AS num FROM Articles WHERE title LIKE ?`;
        const values = [`%${title}%`];
        const [res] = await this.repositoryInstance.executeQuery(sql, values);
        return res.num;
    }

    /**
     * Get the matching articles by title via repository.
     */
    async readArticlesByTitle(title, startIndex, endIndex): Promise<[GetArticleDto]> {
        const sql = `SELECT * FROM Articles WHERE TITLE LIKE ? ORDER BY article_id DESC LIMIT ? OFFSET ?;`;
        // limit represents the number of rows.
        const limit = endIndex-startIndex+1;
        // offset is used to specify the starting point for retrieving rows in query result.
        const offset = startIndex===0 ? 0 : startIndex;
        const values = [`%${title}%`, limit, offset];
        const res: Promise<[GetArticleDto]> = await this.repositoryInstance.executeQuery(sql, values);
        return res;
    }

    /**
     * Returns all articles and pagination items for main page.
     */
    async getMainPageItems(title, currentPage, itemsPerPage): Promise<{ articles: [GetArticleDto], pagination: any }  > {
        ({ title, currentPage, itemsPerPage } = this.validateQueries(title, currentPage, itemsPerPage));
        const numberOfArticles = await this.readNumberOfArticlesByTitle(title);
        const pagination = this.getPaginationItems(numberOfArticles, currentPage, itemsPerPage);
        const articles: [GetArticleDto] = await this.readArticlesByTitle(title, pagination.startIndex, pagination.endIndex);
        return { articles, pagination };
    }

    async getArticleById(id): Promise<GetArticleDto> {
        const sql = `SELECT * FROM Articles WHERE article_id = ?;`;
        const values = [`${id}`];
        const [article] = await this.repositoryInstance.executeQuery(sql, values);
        return article;
    }

    getCurrentDate() {
        const date_obj = new Date();
        const today = date_obj.getFullYear() + "-" + (date_obj.getMonth() + 1).toString() + "-" + date_obj.getDate();
        return today;
    }

    async postArticle(createArticleDto: CreateArticleDto): Promise<any> {
        const sql = `INSERT INTO Articles (title, content, post_date, update_date, author) VALUES (?, ?, ?, ?, ?);`;
        const post_date = this.getCurrentDate();
        const update_date = post_date;
        const values = [ createArticleDto.title, createArticleDto.content, post_date, update_date, createArticleDto.author ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows!==1) {
            throw new HttpException('Failed to post the article.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return res;
    }

    async deleteArticle(deleteArticleDto: DeleteArticleDto): Promise<number> {
        const sql = `DELETE FROM Articles WHERE article_id = ?;`;
        const values = [ [ deleteArticleDto.id ] ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows!==1) {
            throw new HttpException('Failed to delete the article.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return res.affectedRows;
    }

    async putArticle(article_id, putArticleDto: PutArticleDto): Promise<number> {
        const sql = `UPDATE Articles SET title = ?, content = ?, update_date = ? WHERE article_id = ?;`;
        const update_date = this.getCurrentDate();
        const values = [ putArticleDto.title, putArticleDto.content, update_date, article_id ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.changedRows!==1) {
            throw new HttpException('Failed to edit the article.', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return res.changedRows;
    }

    async putComment(putCommentDto: PutCommentDto): Promise<number> {
        const sql = `UPDATE Comments SET content = ? WHERE comment_id = ?;`;
        const values = [ putCommentDto.content, putCommentDto.comment_id ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.changedRows!==1) {
            throw new HttpException('Failed to edit the article.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return res.changedRows;
    }

    async confirmArticleAuthor(id, user) {
        const article = await this.getArticleById(id);
        const userNotMatch = article.author!==user ? true : false;
        if(userNotMatch) {
            throw new HttpException('You are not authorized to edit this article.', HttpStatus.FORBIDDEN);
        }
    }

    async getMaxCommentOrder() {
    }

    async getNewGroupNum(article_id): Promise<number> {
        const sql = `SELECT MAX(Comments.group_num) AS maxGroupNum FROM Articles RIGHT JOIN Comments ON Articles.article_id = Comments.article_id WHERE Articles.article_id = ?;`;
        const values = [ article_id ];
        const [res] = await this.repositoryInstance.executeQuery(sql, values);
        res.maxGroupNum ??= 0;
        return res.maxGroupNum+1;
    }

    async postComment(article_id, createCommentDto: CreateCommentDto): Promise<number> {
        const sql = `INSERT INTO Comments (article_id, author, time, depth, comment_order, group_num, content) VALUES (?);`;
        const time = this.getCurrentDate();
        const depth = 0;
        // Each comment has its own group_num. Replies are appended to comments.
        const group_num = await this.getNewGroupNum(createCommentDto.id);
        const comment_order = 1;
        const values = [ [ article_id, createCommentDto.author, time, depth, comment_order, group_num, createCommentDto.content ] ];
        const { insertId } = await this.repositoryInstance.executeQuery(sql, values);
        if(insertId<=0) {
            throw new HttpException('Failed to comment.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return insertId;
    }

    async getCommentsByArticleId(id): Promise<GetCommentDto[]> {
        const sql = `SELECT * FROM Comments WHERE article_id = ? ORDER BY group_num, comment_order;`;
        const values = [ id ]; 
        const comments: GetCommentDto[] = await this.repositoryInstance.executeQuery(sql, values);
        return comments;
    }

    async deleteCommentById(id, depth): Promise<number> {
        const sql = depth ? `DELETE FROM Comments WHERE comment_id = ?;` : `UPDATE Comments SET author = 'DELETED', author = 'DELETED', content = 'DELETED' WHERE comment_id = ?;`;
        const values = [ id ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows!==1) {
            throw new HttpException('Failed to delete the comment.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return res.affectedRows;
    }

    async confirmCommentAuthor(id, user): Promise<boolean> {
        const sql = `SELECT * FROM Comments WHERE comment_id = ?`;
        const values = [ id ];
        const getCommentDto: GetCommentDto = await this.repositoryInstance.executeQuery(sql, values);
        const userNotMatch = getCommentDto[0].author!==user ? true : false;
        if(userNotMatch) {
            throw new HttpException('You are not authorized to edit this comment.', HttpStatus.FORBIDDEN);
        }
        return userNotMatch;
    }

}

