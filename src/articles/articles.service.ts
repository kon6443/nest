import { Injectable } from '@nestjs/common';
import { MySQLRepository } from './articles.MySQLRepository';
import { GetArticlesDTO } from './dto/get-articles.dto'; 

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
    async readArticlesByTitle(title, startIndex, endIndex): Promise<GetArticlesDTO[]> {
        const sql = `SELECT * FROM Articles WHERE TITLE LIKE ? ORDER BY article_id DESC LIMIT ? OFFSET ?;`;
        // limit represents the number of rows.
        const limit = endIndex-startIndex+1;
        // offset is used to specify the starting point for retrieving rows in query result.
        const offset = startIndex===0 ? 0 : startIndex;
        const values = [`%${title}%`, limit, offset];
        const res: Promise<GetArticlesDTO[]> = await this.repositoryInstance.executeQuery(sql, values);
        return res;
    }

    /**
     * Returns all articles and pagination items for main page.
     */
    async getMainPageItems(title, currentPage, itemsPerPage): Promise<{ articles: GetArticlesDTO[], pagination: any }  > {
        ({ title, currentPage, itemsPerPage } = this.validateQueries(title, currentPage, itemsPerPage));
        const numberOfArticles = await this.readNumberOfArticlesByTitle(title);
        const pagination = this.getPaginationItems(numberOfArticles, currentPage, itemsPerPage);
        const articles: GetArticlesDTO[] = await this.readArticlesByTitle(title, pagination.startIndex, pagination.endIndex);
        return { articles, pagination };
    }

    async getArticleById(id): Promise<GetArticlesDTO> {
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

    async postArticle(author, title, content): Promise<any> {
        const sql = `INSERT INTO Articles (title, content, post_date, update_date, author) VALUES (?, ?, ?, ?, ?);`;
        const post_date = this.getCurrentDate();
        const update_date = post_date;
        const values = [ title, content, post_date, update_date, author ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        return res;
    }

    async deleteArticle(article_id, author): Promise<number> {
        const sql = `DELETE FROM Articles WHERE article_id = ?;`;
        const values = [ article_id ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        return res.affectedRows;
    }

    async putArticle(article_id, title, content): Promise<number> {
        const sql = `UPDATE Articles SET title = ?, content = ?, update_date = ? WHERE article_id = ?;`;
        const update_date = this.getCurrentDate();
        const values = [ title, content, update_date, article_id ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        return res.changedRows;
    }

    async confirmArticleAuthor(id, user): Promise<boolean> {
        const article = await this.getArticleById(id);
        return article.author===user ? true : false;
    }

}

