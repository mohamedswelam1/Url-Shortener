import { ApiProperty } from "@nestjs/swagger";

export class UrlResponseDto {
  @ApiProperty({
    description: 'The original long URL',
    example: 'https://example.com/very/long/url/that/needs/shortening'
  })
  originalUrl: string;
  
  @ApiProperty({
    description: 'The short code generated for the URL',
    example: 'abc123'
  })
  shortCode: string;
  
  @ApiProperty({
    description: 'The complete shortened URL',
    example: 'http://short.url/abc123'
  })
  shortUrl: string;
  
  @ApiProperty({
    description: 'When the short URL was created',
    example: '2023-04-26T12:34:56.789Z'
  })
  createdAt: Date;
} 