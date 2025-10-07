import { Request, Response, NextFunction } from 'express';
import { db } from '../services/database.service';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { UploadTrackDto, GetTracksDto } from '../dto/track.dto';
import * as fs from 'fs';
import * as path from 'path';

export class TrackController {
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error = ErrorMiddleware.createError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
        throw error;
      }

      // Check if user is an artist, create one if not (for testing purposes)
      let artist = await db.prisma.artist.findUnique({
        where: { userId: req.user.userId },
      });

      if (!artist) {
        // Get user details for artist profile creation
        const user = await db.prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { username: true, email: true }
        });
        
        // Auto-create artist profile for testing
        artist = await db.prisma.artist.create({
          data: {
            userId: req.user.userId,
            stageName: user?.username || user?.email.split('@')[0] || 'Unknown Artist',
            bio: 'Test artist profile - auto-created for uploads',
            genres: ['User Upload'],
          },
        });
        
        // Update user type to ARTIST
        await db.prisma.user.update({
          where: { id: req.user.userId },
          data: { userType: 'ARTIST' },
        });
        
        console.log(`Auto-created artist profile for user: ${user?.username || user?.email}`);
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const audioFile = files?.audio?.[0];
      const artworkFile = files?.artwork?.[0];

      if (!audioFile) {
        const error = ErrorMiddleware.createError(
          'Audio file is required',
          400,
          'AUDIO_FILE_REQUIRED'
        );
        throw error;
      }

      const {
        title,
        description,
        genre,
        subGenre,
        bpm,
        keySignature,
        isExplicit,
        tags
      } = req.body as UploadTrackDto;

      // Parse tags if they come as a string
      let parsedTags: string[] = [];
      if (tags) {
        if (typeof tags === 'string') {
          parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      }

      // TODO: Get actual audio file duration using ffmpeg
      const duration = 180; // 3 minutes default - should be replaced with actual duration

      const result = await db.prisma.$transaction(async (prisma) => {
        // Create track record
        const track = await prisma.track.create({
          data: {
            artistId: artist.id,
            title,
            description: description || null,
            duration,
            fileUrl: `/uploads/audio/${audioFile.filename}`,
            artworkUrl: artworkFile ? `/uploads/artwork/${artworkFile.filename}` : null,
            genre,
            subGenre: subGenre || null,
            bpm: bpm ? parseInt(String(bpm)) : null,
            keySignature: keySignature || null,
            isExplicit: Boolean(isExplicit === true || isExplicit === 'true'),
            tags: parsedTags.length > 0 ? parsedTags : null,
            status: 'PENDING',
          },
          select: {
            id: true,
            title: true,
            fileUrl: true,
            artworkUrl: true,
            status: true,
            createdAt: true,
          },
        });

        // Create upload record
        await prisma.trackUpload.create({
          data: {
            userId: req.user!.userId,
            trackId: track.id,
            filename: audioFile.filename,
            originalName: audioFile.originalname,
            fileSize: audioFile.size,
            mimeType: audioFile.mimetype,
            uploadUrl: `/uploads/audio/${audioFile.filename}`,
            status: 'COMPLETED',
          },
        });

        return track;
      });

      res.status(201).json({
        message: 'Track uploaded successfully',
        track: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { genre, limit = 20, offset = 0 } = req.query as any as GetTracksDto;

      const tracks = await db.prisma.track.findMany({
        where: {
          status: 'PENDING',
          isPublic: true,
          ...(genre && { genre }),
        },
        include: {
          artist: {
            select: {
              id: true,
              stageName: true,
              isVerified: true,
              profileImageUrl: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit) || 20, 100),
        skip: Number(offset) || 0,
      });

      // Filter tracks to only include those with existing files
      const validTracks = tracks.filter(track => {
        if (!track.fileUrl) return false;

        // Remove leading slash and construct proper path
        const relativePath = track.fileUrl.startsWith('/') ? track.fileUrl.slice(1) : track.fileUrl;
        const filePath = path.join(process.cwd(), relativePath);
        return fs.existsSync(filePath);
      });

      // Get total count of valid tracks for pagination
      const allTracks = await db.prisma.track.findMany({
        where: {
          status: 'PENDING',
          isPublic: true,
          ...(genre && { genre }),
        },
        select: { fileUrl: true },
      });

      const validTrackCount = allTracks.filter(track => {
        if (!track.fileUrl) return false;
        // Remove leading slash and construct proper path
        const relativePath = track.fileUrl.startsWith('/') ? track.fileUrl.slice(1) : track.fileUrl;
        const filePath = path.join(process.cwd(), relativePath);
        return fs.existsSync(filePath);
      }).length;

      res.json({
        message: 'Tracks retrieved successfully',
        tracks: validTracks,
        pagination: {
          total: validTrackCount,
          limit: Number(limit) || 20,
          offset: Number(offset) || 0,
          hasMore: (Number(offset) || 0) + validTracks.length < validTrackCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const track = await db.prisma.track.findUnique({
        where: { id },
        include: {
          artist: {
            select: {
              id: true,
              stageName: true,
              isVerified: true,
              profileImageUrl: true,
            },
          },
        },
      });

      if (!track || (track.status !== 'APPROVED' && track.status !== 'PENDING') || !track.isPublic) {
        const error = ErrorMiddleware.createError(
          'Track not found',
          404,
          'TRACK_NOT_FOUND'
        );
        throw error;
      }

      res.json({
        message: 'Track retrieved successfully',
        track,
      });
    } catch (error) {
      next(error);
    }
  }

  static async stream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const track = await db.prisma.track.findUnique({
        where: { id },
        include: {
          artist: {
            select: {
              stageName: true,
            },
          },
        },
      });

      if (!track || (track.status !== 'APPROVED' && track.status !== 'PENDING') || !track.isPublic) {
        const error = ErrorMiddleware.createError(
          'Track not found',
          404,
          'TRACK_NOT_FOUND'
        );
        throw error;
      }

      // Increment stream count in background
      db.prisma.track.update({
        where: { id },
        data: {
          streamCount: {
            increment: 1,
          },
        },
      }).catch((error) => {
        console.error('Failed to increment stream count:', error);
      });

      // Log the stream if user is authenticated
      if (req.user) {
        db.prisma.stream.create({
          data: {
            userId: req.user.userId,
            trackId: id,
            durationPlayed: 0,
            deviceType: req.headers['user-agent'],
            platform: 'web',
          },
        }).catch((error) => {
          console.error('Failed to log stream:', error);
        });
      }

      // Serve the actual audio file
      const relativePath = track.fileUrl.startsWith('/') ? track.fileUrl.slice(1) : track.fileUrl;
      const filePath = path.join(process.cwd(), relativePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        const error = ErrorMiddleware.createError(
          'Audio file not found',
          404,
          'FILE_NOT_FOUND'
        );
        throw error;
      }

      // Set appropriate headers for audio streaming
      const stat = fs.statSync(filePath);
      const range = req.headers.range;

      if (range) {
        // Handle range requests for audio streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;

        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
        };

        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Serve entire file
        const head = {
          'Content-Length': stat.size,
          'Content-Type': 'audio/mpeg',
          'Accept-Ranges': 'bytes',
        };

        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        const error = ErrorMiddleware.createError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
        throw error;
      }

      // Find the track to delete
      const track = await db.prisma.track.findUnique({
        where: { id },
        include: {
          artist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!track) {
        const error = ErrorMiddleware.createError(
          'Track not found',
          404,
          'TRACK_NOT_FOUND'
        );
        throw error;
      }

      // Check if the user owns this track
      if (track.artist.userId !== req.user.userId) {
        const error = ErrorMiddleware.createError(
          'Unauthorized - You can only delete your own tracks',
          403,
          'UNAUTHORIZED'
        );
        throw error;
      }

      await db.prisma.$transaction(async (prisma) => {
        // Delete related records first (foreign key constraints)
        await prisma.stream.deleteMany({
          where: { trackId: id },
        });

        await prisma.trackUpload.deleteMany({
          where: { trackId: id },
        });

        // Delete the track
        await prisma.track.delete({
          where: { id },
        });
      });

      // Delete the actual files
      const relativePath = track.fileUrl.startsWith('/') ? track.fileUrl.slice(1) : track.fileUrl;
      const audioFilePath = path.join(process.cwd(), relativePath);

      // Delete audio file if it exists
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
        console.log(`🗑️  Deleted audio file: ${audioFilePath}`);
      }

      // Delete artwork file if it exists
      if (track.artworkUrl) {
        const artworkRelativePath = track.artworkUrl.startsWith('/') ? track.artworkUrl.slice(1) : track.artworkUrl;
        const artworkFilePath = path.join(process.cwd(), artworkRelativePath);
        if (fs.existsSync(artworkFilePath)) {
          fs.unlinkSync(artworkFilePath);
          console.log(`🗑️  Deleted artwork file: ${artworkFilePath}`);
        }
      }

      res.json({
        message: 'Track deleted successfully',
        deletedTrack: {
          id: track.id,
          title: track.title,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}