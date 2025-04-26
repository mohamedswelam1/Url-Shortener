import { NotFoundException } from '@nestjs/common';

export class UrlNotFoundException extends NotFoundException {
  constructor(shortCode: string) {
    super(`URL with short code '${shortCode}' not found`);
  }
}