/**
 * get-article.dto.ts
 */

export class GetArticleDto {
    article_id: number;
    title: string;
    content: string;
    post_date: string;
    update_date: string;
    author: string;

    constructor(partial: Partial<GetArticleDto>) {
        Object.assign(this, partial);
    }
}
