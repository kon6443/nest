/**
 * get-articles.dto.ts
 */

export class GetArticlesDTO {
    article_id: number;
    title: string;
    content: string;
    post_date: string;
    update_date: string;
    author: string;

    constructor(partial: Partial<GetArticlesDTO>) {
        Object.assign(this, partial);
    }
}
