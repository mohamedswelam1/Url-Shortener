"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const urls_service_1 = require("./urls.service");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const cache_manager_1 = require("@nestjs/cache-manager");
const common_1 = require("@nestjs/common");
describe('UrlsService', () => {
    let service;
    let prismaService;
    let configService;
    let cacheManager;
    beforeEach(async () => {
        const prismaServiceMock = {
            url: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
            },
        };
        const configServiceMock = {
            get: jest.fn(),
        };
        const cacheManagerMock = {
            get: jest.fn(),
            set: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                urls_service_1.UrlsService,
                { provide: prisma_service_1.PrismaService, useValue: prismaServiceMock },
                { provide: config_1.ConfigService, useValue: configServiceMock },
                { provide: cache_manager_1.CACHE_MANAGER, useValue: cacheManagerMock },
            ],
        }).compile();
        service = module.get(urls_service_1.UrlsService);
        prismaService = module.get(prisma_service_1.PrismaService);
        configService = module.get(config_1.ConfigService);
        cacheManager = module.get(cache_manager_1.CACHE_MANAGER);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should return existing URL when hash already exists', async () => {
            const dto = {
                originalUrl: 'https://example.com',
            };
            const existingUrl = {
                id: 1,
                shortCode: 'existing',
                originalUrl: 'https://example.com',
                urlHash: 'somehash',
                createdAt: new Date(),
                accessCount: 5,
                lastAccessed: new Date(),
            };
            prismaService.url.findFirst.mockResolvedValue(existingUrl);
            configService.get.mockReturnValue('http://localhost:3000');
            const result = await service.create(dto);
            expect(result.shortCode).toBe('existing');
            expect(result.originalUrl).toBe('https://example.com');
            expect(result.shortUrl).toBe('http://localhost:3000/existing');
            expect(prismaService.url.findFirst).toHaveBeenCalledWith({
                where: { urlHash: expect.any(String) },
            });
            expect(prismaService.url.create).not.toHaveBeenCalled();
            expect(cacheManager.set).toHaveBeenCalledWith('existing', 'https://example.com', 60 * 60 * 1000);
        });
        it('should create a url with generated code', async () => {
            const dto = {
                originalUrl: 'https://example.com',
            };
            const mockCreatedUrl = {
                id: 1,
                shortCode: 'abc123',
                originalUrl: 'https://example.com',
                urlHash: 'hash',
                createdAt: new Date(),
                accessCount: 0,
                lastAccessed: null,
            };
            prismaService.url.findFirst.mockResolvedValue(null);
            prismaService.url.findUnique.mockResolvedValue(null);
            prismaService.url.create.mockResolvedValue(mockCreatedUrl);
            configService.get.mockReturnValue('http://localhost:3000');
            const result = await service.create(dto);
            expect(result.originalUrl).toBe('https://example.com');
            expect(prismaService.url.create).toHaveBeenCalled();
            expect(cacheManager.set).toHaveBeenCalled();
        });
        it('should handle collisions when generating code', async () => {
            const dto = {
                originalUrl: 'https://example.com',
            };
            const existingUrl = {
                id: 1,
                shortCode: 'abc123',
                originalUrl: 'https://existing.com',
                urlHash: 'hash',
                createdAt: new Date(),
                accessCount: 0,
                lastAccessed: null,
            };
            const mockCreatedUrl = {
                id: 2,
                shortCode: 'xyz789',
                originalUrl: 'https://example.com',
                urlHash: 'hash2',
                createdAt: new Date(),
                accessCount: 0,
                lastAccessed: null,
            };
            prismaService.url.findFirst.mockResolvedValue(null);
            prismaService.url.findUnique
                .mockResolvedValueOnce(existingUrl)
                .mockResolvedValueOnce(null);
            prismaService.url.create.mockResolvedValue(mockCreatedUrl);
            configService.get.mockReturnValue('http://localhost:3000');
            const result = await service.create(dto);
            expect(result.originalUrl).toBe('https://example.com');
            expect(prismaService.url.findUnique).toHaveBeenCalledTimes(2);
            expect(prismaService.url.create).toHaveBeenCalled();
        });
    });
    describe('findByShortCode', () => {
        it('should return URL from cache if available', async () => {
            const shortCode = 'abc123';
            const cachedUrl = 'https://example.com';
            cacheManager.get.mockResolvedValue(cachedUrl);
            const result = await service.findByShortCode(shortCode);
            expect(result).toBe(cachedUrl);
            expect(cacheManager.get).toHaveBeenCalledWith(shortCode);
            expect(cacheManager.set).toHaveBeenCalledWith(shortCode, cachedUrl, 60 * 60 * 1000);
            expect(prismaService.url.findUnique).not.toHaveBeenCalled();
        });
        it('should fetch URL from database if not in cache', async () => {
            const shortCode = 'abc123';
            const url = {
                id: 1,
                shortCode: 'abc123',
                originalUrl: 'https://example.com',
                urlHash: 'hash',
                createdAt: new Date(),
                accessCount: 0,
                lastAccessed: null,
            };
            cacheManager.get.mockResolvedValue(null);
            prismaService.url.findUnique.mockResolvedValue(url);
            const result = await service.findByShortCode(shortCode);
            expect(result).toBe('https://example.com');
            expect(cacheManager.get).toHaveBeenCalledWith(shortCode);
            expect(prismaService.url.findUnique).toHaveBeenCalledWith({ where: { shortCode } });
            expect(cacheManager.set).toHaveBeenCalledWith(shortCode, 'https://example.com', 60 * 60 * 1000);
        });
        it('should throw NotFoundException if URL not found', async () => {
            const shortCode = 'notfound';
            cacheManager.get.mockResolvedValue(null);
            prismaService.url.findUnique.mockResolvedValue(null);
            await expect(service.findByShortCode(shortCode)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('helper methods', () => {
        it('should generate a hash for a URL using SHA-256', () => {
            const url = 'https://example.com';
            const hash = service.hashUrl(url);
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });
        it('should generate a short code from a URL using MD5', () => {
            const url = 'https://example.com';
            const shortCode = service.generateShortCodeFromHash(url);
            expect(shortCode).toBeDefined();
            expect(typeof shortCode).toBe('string');
            expect(shortCode.length).toBe(7);
        });
    });
});
//# sourceMappingURL=urls.service.spec.js.map