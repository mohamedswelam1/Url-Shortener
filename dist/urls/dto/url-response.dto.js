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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UrlResponseDto {
}
exports.UrlResponseDto = UrlResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The original long URL',
        example: 'https://example.com/very/long/url/that/needs/shortening'
    }),
    __metadata("design:type", String)
], UrlResponseDto.prototype, "originalUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The short code generated for the URL',
        example: 'abc123'
    }),
    __metadata("design:type", String)
], UrlResponseDto.prototype, "shortCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The complete shortened URL',
        example: 'http://short.url/abc123'
    }),
    __metadata("design:type", String)
], UrlResponseDto.prototype, "shortUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'When the short URL was created',
        example: '2023-04-26T12:34:56.789Z'
    }),
    __metadata("design:type", Date)
], UrlResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=url-response.dto.js.map