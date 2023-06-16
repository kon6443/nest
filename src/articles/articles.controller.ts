import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ArticlesService } from './articles.service';
import { GetArticlesDTO } from './dto/get-articles.dto';

@Controller('articles')
export class ArticlesController {

    constructor(private readonly serviceInstance: ArticlesService) {}

    @Get()
    async handleGetMain(@Req() { query }: Request): Promise<GetArticlesDTO[]> {
        const { title, 'current-page': currentPage, 'items-per-page': itemsPerPage }: { title?: string, 'current-page'?: number, 'items-per-page'?: number } = query;
        const articles: GetArticlesDTO[] = await this.serviceInstance.getArticlesByPage(title, currentPage, itemsPerPage);
        return articles;
    }

    @Get('2')
    handleGetPracticeReqObject(@Req() req: Request): string {
        console.log('req:', req);
        return 'practice request object.';
    }
}
