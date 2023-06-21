/**
 * delete-article.dto.ts
 */

export class DeleteArticleDto {
    id: number;
    title: string;
    content: string;
    post_date: string;
    update_date: string;
    author: string;

    constructor(partial: Partial<DeleteArticleDto>) {
        Object.assign(this, partial);
    }
}
