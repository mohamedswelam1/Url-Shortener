import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
export declare class UrlsController {
    private readonly urlsService;
    constructor(urlsService: UrlsService);
    create(createUrlDto: CreateUrlDto): Promise<UrlResponseDto>;
    redirect(code: string): Promise<{
        url: string;
        statusCode: number;
    }>;
}
