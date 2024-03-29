/**
 * create-articles.dto.ts
 */

export class CreateArticleDto {
    article_id: number;
    title: string;
    content: string;
    post_date: string;
    update_date: string;
    author: string;

    constructor(partial: Partial<CreateArticleDto>) {
        Object.assign(this, partial);
    }
}
