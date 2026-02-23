import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {
    const uploadPath = this.config.get('UPLOAD_PATH') || './uploads';
    if (\!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  }

  getFilePath(filename: string): string {
    const uploadPath = this.config.get('UPLOAD_PATH') || './uploads';
    return path.join(uploadPath, filename);
  }

  deleteFile(filename: string): void {
    const filePath = this.getFilePath(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
