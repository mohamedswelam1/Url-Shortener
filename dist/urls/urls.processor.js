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
exports.UrlsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
let UrlsProcessor = class UrlsProcessor {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateStats(job) {
        const { shortCode } = job.data;
        const url = await this.prisma.url.findUnique({
            where: { shortCode },
        });
        if (url) {
            await this.prisma.url.update({
                where: { id: url.id },
                data: {
                    lastAccessed: new Date(),
                    accessCount: url.accessCount + 1,
                },
            });
        }
    }
};
exports.UrlsProcessor = UrlsProcessor;
__decorate([
    (0, bull_1.Process)('updateStats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UrlsProcessor.prototype, "updateStats", null);
exports.UrlsProcessor = UrlsProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('urls'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UrlsProcessor);
//# sourceMappingURL=urls.processor.js.map