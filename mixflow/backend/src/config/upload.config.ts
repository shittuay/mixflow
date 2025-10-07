import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ErrorMiddleware } from '../middleware/error.middleware';

export class UploadConfig {
  private static uploadDir = path.join(__dirname, '../../uploads');
  private static audioDir = path.join(this.uploadDir, 'audio');
  private static artworkDir = path.join(this.uploadDir, 'artwork');

  static initialize(): void {
    // Ensure upload directories exist
    [this.uploadDir, this.audioDir, this.artworkDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created upload directory: ${dir}`);
      }
    });
  }

  static getMulterConfig(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        if (file.fieldname === 'audio') {
          cb(null, this.audioDir);
        } else if (file.fieldname === 'artwork') {
          cb(null, this.artworkDir);
        } else {
          cb(ErrorMiddleware.createError('Invalid field name', 400, 'INVALID_FIELD'), '');
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const extension = path.extname(file.originalname);
        const sanitizedName = file.originalname
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .substring(0, 50);
        cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedName}${extension}`);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 2, // Max 2 files (audio + artwork)
      },
      fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio') {
          if (this.isValidAudioFile(file)) {
            cb(null, true);
          } else {
            cb(ErrorMiddleware.createError(
              'Only audio files are allowed (MP3, WAV, FLAC, AAC, M4A, WebM, OGG, WMA)',
              400,
              'INVALID_AUDIO_FILE'
            ));
          }
        } else if (file.fieldname === 'artwork') {
          if (this.isValidImageFile(file)) {
            cb(null, true);
          } else {
            cb(ErrorMiddleware.createError(
              'Only image files are allowed (JPEG, PNG, WebP)',
              400,
              'INVALID_IMAGE_FILE'
            ));
          }
        } else {
          cb(ErrorMiddleware.createError(
            'Invalid field name. Allowed: audio, artwork',
            400,
            'INVALID_FIELD_NAME'
          ));
        }
      }
    });
  }

  private static isValidAudioFile(file: Express.Multer.File): boolean {
    const allowedMimes = [
      'audio/mpeg',        // MP3
      'audio/wav',         // WAV
      'audio/x-wav',       // WAV alternative
      'audio/flac',        // FLAC
      'audio/x-flac',      // FLAC alternative
      'audio/aac',         // AAC
      'audio/mp4',         // M4A
      'audio/x-m4a',       // M4A alternative
      'audio/webm',        // WebM audio (for testing)
      'audio/ogg',         // OGG
      'video/webm',        // WebM (sometimes detected as video)
      'audio/x-ms-wma',    // WMA
      'audio/vnd.wave',    // WAV alternative
    ];

    const allowedExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.webm', '.ogg', '.wma'];
    const extension = path.extname(file.originalname).toLowerCase();

    return allowedMimes.includes(file.mimetype) || allowedExtensions.includes(extension);
  }

  private static isValidImageFile(file: Express.Multer.File): boolean {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const extension = path.extname(file.originalname).toLowerCase();

    return allowedMimes.includes(file.mimetype) && allowedExtensions.includes(extension);
  }

  static getUploadDir(): string {
    return this.uploadDir;
  }
}