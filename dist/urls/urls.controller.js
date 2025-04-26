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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlsController = void 0;
const common_1 = require("@nestjs/common");
const urls_service_1 = require("./urls.service");
const create_url_dto_1 = require("./dto/create-url.dto");
const url_response_dto_1 = require("./dto/url-response.dto");
const url_not_found_exception_1 = require("../common/exceptions/url-not-found.exception");
const swagger_1 = require("@nestjs/swagger");
let UrlsController = class UrlsController {
    constructor(urlsService) {
        this.urlsService = urlsService;
    }
    create(createUrlDto) {
        return this.urlsService.create(createUrlDto);
    }
    async redirect(code) {
        try {
            const originalUrl = await this.urlsService.findByShortCode(code);
            return { url: originalUrl, statusCode: 302 };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new url_not_found_exception_1.UrlNotFoundException(code);
        }
    }
};
exports.UrlsController = UrlsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new short URL' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'The short URL has been successfully created.', type: url_response_dto_1.UrlResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid URL provided.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_url_dto_1.CreateUrlDto]),
    __metadata("design:returntype", Promise)
], UrlsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':code'),
    (0, swagger_1.ApiOperation)({ summary: 'Redirect to original URL' }),
    (0, swagger_1.ApiParam)({ name: 'code', description: 'The short code to look up' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the original URL and status code for redirection',
        schema: {
            properties: {
                url: { type: 'string', example: 'https://example.com' },
                statusCode: { type: 'number', example: 302 }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'URL not found' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UrlsController.prototype, "redirect", null);
exports.UrlsController = UrlsController = __decorate([
    (0, common_1.Controller)('urls'),
    __metadata("design:paramtypes", [urls_service_1.UrlsService])
], UrlsController);
//# sourceMappingURL=urls.controller.js.map