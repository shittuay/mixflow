import { Request, Response, NextFunction } from 'express';
import { db } from '../services/database.service';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { CreateArtistDto } from '../dto/artist.dto';

export class ArtistController {
  static async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error = ErrorMiddleware.createError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
        throw error;
      }

      const { stageName, bio, genres = [] } = req.body as CreateArtistDto;

      // Check if user already has an artist profile
      const existingArtist = await db.prisma.artist.findUnique({
        where: { userId: req.user.userId },
      });

      if (existingArtist) {
        const error = ErrorMiddleware.createError(
          'Artist profile already exists',
          409,
          'ARTIST_PROFILE_EXISTS'
        );
        throw error;
      }

      // Create artist profile in a transaction
      const result = await db.prisma.$transaction(async (prisma) => {
        const artist = await prisma.artist.create({
          data: {
            userId: req.user!.userId,
            stageName,
            bio: bio || null,
            genres: Array.isArray(genres) ? genres : (genres ? [genres] : []),
          },
          select: {
            id: true,
            stageName: true,
            bio: true,
            genres: true,
            isVerified: true,
            totalStreams: true,
            createdAt: true,
          },
        });

        // Update user type to ARTIST
        await prisma.user.update({
          where: { id: req.user!.userId },
          data: { userType: 'ARTIST' },
        });

        return artist;
      });

      res.status(201).json({
        message: 'Artist profile created successfully',
        artist: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTracks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error = ErrorMiddleware.createError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
        throw error;
      }

      const artist = await db.prisma.artist.findUnique({
        where: { userId: req.user.userId },
      });

      if (!artist) {
        const error = ErrorMiddleware.createError(
          'Only artists can view their tracks',
          403,
          'ARTIST_REQUIRED'
        );
        throw error;
      }

      const tracks = await db.prisma.track.findMany({
        where: { artistId: artist.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          fileUrl: true,
          artworkUrl: true,
          genre: true,
          subGenre: true,
          bpm: true,
          keySignature: true,
          status: true,
          streamCount: true,
          downloadCount: true,
          isPublic: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        message: 'Tracks retrieved successfully',
        tracks,
        total: tracks.length,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const artist = await db.prisma.artist.findUnique({
        where: { id },
        select: {
          id: true,
          stageName: true,
          bio: true,
          profileImageUrl: true,
          coverImageUrl: true,
          isVerified: true,
          totalStreams: true,
          genres: true,
          createdAt: true,
          tracks: {
            where: {
              status: 'APPROVED',
              isPublic: true,
            },
            select: {
              id: true,
              title: true,
              artworkUrl: true,
              duration: true,
              streamCount: true,
              createdAt: true,
            },
            orderBy: { streamCount: 'desc' },
            take: 10,
          },
        },
      });

      if (!artist) {
        const error = ErrorMiddleware.createError(
          'Artist not found',
          404,
          'ARTIST_NOT_FOUND'
        );
        throw error;
      }

      res.json({
        message: 'Artist profile retrieved successfully',
        artist,
      });
    } catch (error) {
      next(error);
    }
  }
}