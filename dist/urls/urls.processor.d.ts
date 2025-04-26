import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
export declare class UrlsProcessor {
    private prisma;
    constructor(prisma: PrismaService);
    updateStats(job: Job<{
        shortCode: string;
    }>): Promise<void>;
}
