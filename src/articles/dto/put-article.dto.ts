/**
 * put-article.dto.ts
 */

export class PutArticleDto {
    article_id: number;
    title: string;
    content: string;
    post_date: string;
    update_date: string;
    author: string;

    constructor(partial: Partial<PutArticleDto>) {
        Object.assign(this, partial);
    }
}
