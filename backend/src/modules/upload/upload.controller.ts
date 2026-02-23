import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('upload')
export class UploadController {
  constructor(private config: ConfigService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload professional photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = process.env.UPLOAD_PATH || './uploads';
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        if (!allowed.test(file.originalname)) {
          return cb(new BadRequestException('Apenas imagens JPG, PNG ou WebP sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return {
      url: `${baseUrl}/api/upload/files/${file.filename}`,
      filename: file.filename,
    };
  }
}
