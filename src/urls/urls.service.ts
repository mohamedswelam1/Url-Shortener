import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';

@Injectable()
export class UrlsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createUrlDto: CreateUrlDto): Promise<UrlResponseDto> {
    const { originalUrl } = createUrlDto;
    
    const urlHash = this.hashUrl(originalUrl);
    
    const existingUrl = await this.prisma.url.findFirst({
      where: {
        urlHash
      },
    });
    
    if (existingUrl) {
      const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
      
      const response = new UrlResponseDto();
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
  
  private async createUrlEntry(originalUrl: string, shortCode: string, urlHash: string): Promise<UrlResponseDto> {
    const url = await this.prisma.url.create({
      data: {
        originalUrl,
        shortCode,
        urlHash,
        accessCount: 0,
      } as Prisma.UrlCreateInput,
    });

    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    
    const response = new UrlResponseDto();
    response.originalUrl = url.originalUrl;
    response.shortCode = url.shortCode;
    response.shortUrl = `${baseUrl}/${url.shortCode}`;
    response.createdAt = url.createdAt;

    await this.cacheManager.set(shortCode, url.originalUrl, 60 * 60 * 1000);

    return response;
  }

  async findByShortCode(shortCode: string) {
    
    const cachedUrl = await this.cacheManager.get<string>(shortCode);
    if (cachedUrl) {
      await this.cacheManager.set(shortCode, cachedUrl, 60 * 60 * 1000);
      return cachedUrl;
    }

    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    await this.cacheManager.set(shortCode, url.originalUrl, 60 * 60 * 1000);

    return url.originalUrl;
  }

  
  private hashUrl(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }
  
  private generateShortCodeFromHash(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex').substring(0, 7);
  }
  
  private getRandomChar(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }
} 