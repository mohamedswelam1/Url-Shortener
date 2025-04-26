import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
@Processor('urls')
export class UrlsProcessor {
  constructor(private prisma: PrismaService) {}

  @Process('updateStats')
  async updateStats(job: Job<{ shortCode: string }>) {
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
} 