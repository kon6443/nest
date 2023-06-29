/**
 * create-user.dto.ts
 */

export class CreateUserDto {
    id: string;
    name: string;
    pw: string;
    pwc: string;
    address: string;
    phone_number: string;

    constructor(partial: Partial<CreateUserDto>) {
        Object.assign(this, partial);
    }
}
