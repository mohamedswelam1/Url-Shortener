import { Test, TestingModule } from '@nestjs/testing';
import { UrlsService } from './urls.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { CreateUrlDto } from './dto/create-url.dto';

type MockPrismaService = {
  url: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  }
};

describe('UrlsService', () => {
  let service: UrlsService;
  let prismaService: MockPrismaService;
  let configService: { get: jest.Mock };
  let cacheManager: { get: jest.Mock; set: jest.Mock };

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    prismaService = module.get(PrismaService) as unknown as MockPrismaService;
    configService = module.get(ConfigService) as unknown as { get: jest.Mock };
    cacheManager = module.get(CACHE_MANAGER) as unknown as { get: jest.Mock; set: jest.Mock };
  });


  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return existing URL when hash already exists', async () => {
      // Arrange
      const dto: CreateUrlDto = {
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

      // Act
      const result = await service.create(dto);

      // Assert
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
      // Arrange
      const dto: CreateUrlDto = {
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

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result.originalUrl).toBe('https://example.com');
      expect(prismaService.url.create).toHaveBeenCalled();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle collisions when generating code', async () => {
      // Arrange
      const dto: CreateUrlDto = {
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
      
      // First findUnique returns an existing URL (collision), second returns null
      prismaService.url.findUnique
        .mockResolvedValueOnce(existingUrl)
        .mockResolvedValueOnce(null);
      
      prismaService.url.create.mockResolvedValue(mockCreatedUrl);
      configService.get.mockReturnValue('http://localhost:3000');

      // Act
      const result = await service.create(dto);

      // Assert
      expect(result.originalUrl).toBe('https://example.com');
      expect(prismaService.url.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.url.create).toHaveBeenCalled();
    });
  });

  describe('findByShortCode', () => {
    it('should return URL from cache if available', async () => {
      // Arrange
      const shortCode = 'abc123';
      const cachedUrl = 'https://example.com';
      
      cacheManager.get.mockResolvedValue(cachedUrl);

      // Act
      const result = await service.findByShortCode(shortCode);

      // Assert
      expect(result).toBe(cachedUrl);
      expect(cacheManager.get).toHaveBeenCalledWith(shortCode);
      expect(cacheManager.set).toHaveBeenCalledWith(shortCode, cachedUrl, 60 * 60 * 1000);
      expect(prismaService.url.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch URL from database if not in cache', async () => {
      // Arrange
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

      // Act
      const result = await service.findByShortCode(shortCode);

      // Assert
      expect(result).toBe('https://example.com');
      expect(cacheManager.get).toHaveBeenCalledWith(shortCode);
      expect(prismaService.url.findUnique).toHaveBeenCalledWith({ where: { shortCode } });
      expect(cacheManager.set).toHaveBeenCalledWith(shortCode, 'https://example.com', 60 * 60 * 1000);
    });

    it('should throw NotFoundException if URL not found', async () => {
      // Arrange
      const shortCode = 'notfound';
      
      cacheManager.get.mockResolvedValue(null);
      prismaService.url.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByShortCode(shortCode)).rejects.toThrow(NotFoundException);
    });
  });


  describe('helper methods', () => {
    it('should generate a hash for a URL using SHA-256', () => {
      // We're testing a private method, so we need to use any to access it
      const url = 'https://example.com';
      const hash = (service as any).hashUrl(url);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      // SHA-256 hashes are 64 characters long in hex
      expect(hash.length).toBe(64);
    });

    it('should generate a short code from a URL using MD5', () => {
      const url = 'https://example.com';
      const shortCode = (service as any).generateShortCodeFromHash(url);
      expect(shortCode).toBeDefined();
      expect(typeof shortCode).toBe('string');
      expect(shortCode.length).toBe(7);
    });
  });
});