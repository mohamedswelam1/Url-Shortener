"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const url_response_dto_1 = require("./dto/url-response.dto");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let UrlsService = class UrlsService {
    constructor(prisma, configService, cacheManager) {
        this.prisma = prisma;
        this.configService = configService;
        this.cacheManager = cacheManager;
    }
    async create(createUrlDto) {
        const { originalUrl } = createUrlDto;
        const urlHash = this.hashUrl(originalUrl);
        const existingUrl = await this.prisma.url.findFirst({
            where: {
                urlHash
            },
        });
        if (existingUrl) {
            const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
            const response = new url_response_dto_1.UrlResponseDto();
            response.originalUrl = existingUrl.originalUrl;
            response.shortCode = existingUrl.shortCode;
            response.shortUrl = `${baseUrl}/${existingUrl.shortCode}`;
            response.createdAt = existingUrl.createdAt;
            await this.cacheManager.set(existingUrl.shortCode, existingUrl.originalUrl, 60 * 60 * 1000);
            return response;
        }
        let shortCode = this.generateShortCodeFromHash(originalUrl);
        let attempts = 0;
        while (attempts < 5) {
            const existing = await this.prisma.url.findUnique({
                where: { shortCode },
            });
            if (!existing) {
                break;
            }
            shortCode = shortCode.substring(0, 6) + this.getRandomChar();
            attempts++;
        }
        return this.createUrlEntry(originalUrl, shortCode, urlHash);
    }
    async createUrlEntry(originalUrl, shortCode, urlHash) {
        const url = await this.prisma.url.create({
            data: {
                originalUrl,
                shortCode,
                urlHash,
                accessCount: 0,
            },
        });
        const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
        const response = new url_response_dto_1.UrlResponseDto();
        response.originalUrl = url.originalUrl;
        response.shortCode = url.shortCode;
        response.shortUrl = `${baseUrl}/${url.shortCode}`;
        response.createdAt = url.createdAt;
        await this.cacheManager.set(shortCode, url.originalUrl, 60 * 60 * 1000);
        return response;
    }
    async findByShortCode(shortCode) {
        const cachedUrl = await this.cacheManager.get(shortCode);
        if (cachedUrl) {
            await this.cacheManager.set(shortCode, cachedUrl, 60 * 60 * 1000);
            return cachedUrl;
        }
        const url = await this.prisma.url.findUnique({
            where: { shortCode },
        });
        if (!url) {
            throw new common_1.NotFoundException('URL not found');
        }
        await this.cacheManager.set(shortCode, url.originalUrl, 60 * 60 * 1000);
        return url.originalUrl;
    }
    hashUrl(url) {
        return crypto.createHash('sha256').update(url).digest('hex');
    }
    generateShortCodeFromHash(url) {
        return crypto.createHash('md5').update(url).digest('hex').substring(0, 7);
    }
    getRandomChar() {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }
};
exports.UrlsService = UrlsService;
exports.UrlsService = UrlsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService, Object])
], UrlsService);
//# sourceMappingURL=urls.service.js.map