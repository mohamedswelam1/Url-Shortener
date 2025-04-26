import { Module } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { UrlsProcessor } from './urls.processor';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from "cache-manager-ioredis";

@Module({
  imports: [
    CacheModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				store: redisStore,
				host: configService.get<string>("REDIS_HOST", "localhost"),
				port: configService.get<number>("REDIS_PORT", 6379),
				password: configService.get<string>("REDIS_PASSWORD"),
				ttl: 60 * 60 * 24 * 30
			}),
			inject: [ConfigService]
		}),  
  ],
  controllers: [UrlsController],
  providers: [UrlsService, UrlsProcessor],
})
export class UrlsModule {} 