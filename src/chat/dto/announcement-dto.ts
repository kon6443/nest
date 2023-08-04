/**
 * announcement-dto.ts
 */

export class AnnouncementDto {
    threadId: number;
    title: string;
    createDate: number;
    // modifyDate: number;
    url: string;

    constructor(partial: Partial<AnnouncementDto>) {
        Object.assign(this, partial);
    }
}
