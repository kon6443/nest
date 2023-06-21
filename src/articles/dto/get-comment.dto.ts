/**
 * get-comment.dto.ts
 */

export class GetCommentDto {
    comment_id: number;
    article_id: number;
    author: string;
    time: string;
    depth: number;
    comment_order: number;
    group_num: number;
    content: string;

    /** 
     * Allows for convenient creation of DTO instances with optional properties. 
     * You can pass an object with a subset of the properties, 
     * and the constructor will merge those values into the DTO instance.
     */
    constructor(partial: Partial<GetCommentDto>) {
        Object.assign(this, partial);
    }
}
