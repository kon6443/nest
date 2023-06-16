import { Injectable } from '@nestjs/common';
import { MySQLRepository } from './articles.MySQLRepository';
import { GetArticlesDTO } from './dto/get-articles.dto'; 

@Injectable()
export class ArticlesService {

    constructor(private readonly repositoryInstance: MySQLRepository) {}

    validateQueries(title: string, currentPage: number, itemsPerPage: number) {
        title = title || '';
        currentPage = currentPage || 1;
        itemsPerPage = itemsPerPage || 10;
        return {
            title,
            currentPage,
            itemsPerPage
        };
    }

    getPaginationItems(numberOfArticles: number, currentPage: number, itemsPerPage: number) {
        const totalPage = Math.ceil(numberOfArticles/itemsPerPage);
        currentPage = currentPage>totalPage ? 1 : currentPage;
        const startIndex = (currentPage-1) * itemsPerPage;
        const endIndex = (currentPage===totalPage) ? numberOfArticles-1 : (currentPage*itemsPerPage-1);
        return {
            currentPage,
            itemsPerPage,
            totalPage,
            startIndex,
            endIndex
        }
    }

    async readNumberOfArticlesByTitle(title): Promise<number> {
        const sql: string = `SELECT COUNT(article_id) AS num FROM Articles WHERE title LIKE ?`;
        const values = [`%${title}%`];
        const [res] = await this.repositoryInstance.executeQuery(sql, values);
        return res.num;
    }

    async readArticlesByTitle(title: string, startIndex: number, endIndex: number): Promise<GetArticlesDTO[]> {
        const sql: string = `SELECT * FROM Articles WHERE TITLE LIKE ? ORDER BY article_id DESC LIMIT ? OFFSET ?;`;
        // limit represents the number of rows.
        const limit: number = endIndex-startIndex+1;
        // offset is used to specify the starting point for retrieving rows in query result.
        const offset: number = startIndex===0 ? 0 : startIndex;
        const values = [`%${title}%`, limit, offset];
        const res: Promise<GetArticlesDTO[]> = await this.repositoryInstance.executeQuery(sql, values);
        return res;
    }

    async getArticlesByPage(title?: string, currentPage?: number, itemsPerPage?: number): Promise<GetArticlesDTO[]> {
        ({ title, currentPage, itemsPerPage } = this.validateQueries(title, currentPage, itemsPerPage));
        const numberOfArticles = await this.readNumberOfArticlesByTitle(title);
        const pagination = this.getPaginationItems(numberOfArticles, currentPage, itemsPerPage);
        const articles: GetArticlesDTO[] = await this.readArticlesByTitle(title, pagination.startIndex, pagination.endIndex);
        return articles;
    }

}

