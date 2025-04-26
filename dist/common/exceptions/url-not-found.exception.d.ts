import { NotFoundException } from '@nestjs/common';
export declare class UrlNotFoundException extends NotFoundException {
    constructor(shortCode: string);
}
