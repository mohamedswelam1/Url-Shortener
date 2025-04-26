import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsOptional, IsString } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The original URL to shorten',
    example: 'https://example.com/very/long/url/that/needs/shortening'
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  originalUrl: string;

} 