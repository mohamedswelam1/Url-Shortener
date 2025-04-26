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
        it('should create a url with custom code', async () => {
            const dto = {
                originalUrl: 'https://example.com',
                customCode: 'custom',
            };
            const mockCreatedUrl = {
                id: 1,
                shortCode: 'custom',
                originalUrl: 'https://example.com',
                urlHash: 'hash',
                createdAt: new Date(),
                accessCount: 0,
                lastAccessed: null,
            };
            prismaService.url.findUnique.mockResolvedValue(null);
            prismaService.url.create.mockResolvedValue(mockCreatedUrl);
            configService.get.mockReturnValue('http://localhost:3000');
            const result = await service.create(dto);
            expect(result.shortCode).toBe('custom');
            expect(result.originalUrl).toBe('https://example.com');
            expect(result.shortUrl).toBe('http://localhost:3000/custom');
            expect(prismaService.url.findUnique).toHaveBeenCalledWith({
                where: { shortCode: 'custom' },
            });
            expect(prismaService.url.create).toHaveBeenCalled();
            expect(cacheManager.set).toHaveBeenCalled();
        });
        it('should throw error when custom code already exists', async () => {
            const dto = {
                originalUrl: 'https://example.com',
                customCode: 'custom',
            };
            prismaService.url.findUnique.mockResolvedValue({
                id: 1,
                shortCode: 'custom',
                originalUrl: 'https://existing.com',
                urlHash: 'hash',
                createdAt: new Date(),
                accessCount: 0,
                lastAccessed: null,
            });
            await expect(service.create(dto)).rejects.toThrow('Custom code already in use');
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
    describe('getStats', () => {
        it('should return URL stats', async () => {
            const shortCode = 'abc123';
            const url = {
                shortCode: 'abc123',
                originalUrl: 'https://example.com',
                createdAt: new Date(),
            };
            prismaService.url.findUnique.mockResolvedValue(url);
            const result = await service.getStats(shortCode);
            expect(result).toEqual({
                shortCode: 'abc123',
                originalUrl: 'https://example.com',
                createdAt: url.createdAt,
            });
            expect(prismaService.url.findUnique).toHaveBeenCalledWith({
                where: { shortCode },
                select: {
                    shortCode: true,
                    originalUrl: true,
                    createdAt: true,
                },
            });
        });
        it('should throw NotFoundException if URL not found', async () => {
            const shortCode = 'notfound';
            prismaService.url.findUnique.mockResolvedValue(null);
            await expect(service.getStats(shortCode)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('helper methods', () => {
        it('should generate a hash for a URL', () => {
            const url = 'https://example.com';
            const hash = service.hashUrl(url);
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });
        it('should generate a short code from a URL', () => {
            const url = 'https://example.com';
            const shortCode = service.generateShortCodeFromHash(url);
            expect(shortCode).toBeDefined();
            expect(typeof shortCode).toBe('string');
            expect(shortCode.length).toBe(7);
        });
    });
});
//# sourceMappingURL=urls.service.test.js.map