/**
 * create-comment.dto.ts
 */

export class CreateCommentDto {
    id: number;
    title: string;
    content: string;
    post_date: string;
    update_date: string;
    author: string;

    constructor(partial: Partial<CreateCommentDto>) {
        Object.assign(this, partial);
    }
}
