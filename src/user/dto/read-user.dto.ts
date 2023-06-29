/**
 * read-user.dto.ts
 */

export class ReadUserDto {
    id: string;
    name: string;
    password: string;
    address: string;
    phone_number: string;

    constructor(partial: Partial<ReadUserDto>) {
        Object.assign(this, partial);
    }
}
