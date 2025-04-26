"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlsModule = void 0;
const common_1 = require("@nestjs/common");
const urls_service_1 = require("./urls.service");
const urls_controller_1 = require("./urls.controller");
const urls_processor_1 = require("./urls.processor");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const redisStore = require("cache-manager-ioredis");
let UrlsModule = class UrlsModule {
};
exports.UrlsModule = UrlsModule;
exports.UrlsModule = UrlsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    store: redisStore,
                    host: configService.get("REDIS_HOST", "localhost"),
                    port: configService.get("REDIS_PORT", 6379),
                    password: configService.get("REDIS_PASSWORD"),
                    ttl: 60 * 60 * 24 * 30
                }),
                inject: [config_1.ConfigService]
            }),
        ],
        controllers: [urls_controller_1.UrlsController],
        providers: [urls_service_1.UrlsService, urls_processor_1.UrlsProcessor],
    })
], UrlsModule);
//# sourceMappingURL=urls.module.js.map