import { PrismaService } from '../prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
export declare class UrlsService {
    private prisma;
    private configService;
    private cacheManager;
    constructor(prisma: PrismaService, configService: ConfigService, cacheManager: Cache);
    create(createUrlDto: CreateUrlDto): Promise<UrlResponseDto>;
    private createUrlEntry;
    findByShortCode(shortCode: string): Promise<string>;
    private hashUrl;
    private generateShortCodeFromHash;
    private getRandomChar;
}
