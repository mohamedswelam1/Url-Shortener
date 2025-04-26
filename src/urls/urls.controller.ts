import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { UrlNotFoundException } from 'src/common/exceptions/url-not-found.exception';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new short URL' })
  @ApiResponse({ status: 201, description: 'The short URL has been successfully created.', type: UrlResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid URL provided.' })
  create(@Body() createUrlDto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlsService.create(createUrlDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiParam({ name: 'code', description: 'The short code to look up' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the original URL and status code for redirection',
    schema: {
      properties: {
        url: { type: 'string', example: 'https://example.com' },
        statusCode: { type: 'number', example: 302 }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'URL not found' })
  async redirect(@Param('code') code: string) {
    try {
      const originalUrl = await this.urlsService.findByShortCode(code);
      return { url: originalUrl, statusCode: 302 };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UrlNotFoundException(code);
    }
  }
} 