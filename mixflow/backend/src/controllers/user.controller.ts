import { Request, Response, NextFunction } from 'express';
import { db } from '../services/database.service';
import { ErrorMiddleware } from '../middleware/error.middleware';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error = ErrorMiddleware.createError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
        throw error;
      }

      const user = await db.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          userType: true,
          subscriptionTier: true,
          isVerified: true,
          createdAt: true,
          artist: {
            select: {
              id: true,
              stageName: true,
              bio: true,
              profileImageUrl: true,
              coverImageUrl: true,
              isVerified: true,
              totalStreams: true,
              genres: true,
            },
          },
        },
      });

      if (!user) {
        const error = ErrorMiddleware.createError(
          'User not found',
          404,
          'USER_NOT_FOUND'
        );
        throw error;
      }

      res.json({
        message: 'Profile retrieved successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error = ErrorMiddleware.createError(
          'Authentication required',
          401,
          'AUTHENTICATION_REQUIRED'
        );
        throw error;
      }

      const { firstName, lastName, username } = req.body;

      // Check if username is already taken by another user
      if (username) {
        const existingUser = await db.prisma.user.findFirst({
          where: {
            username,
            id: { not: req.user.userId },
          },
        });

        if (existingUser) {
          const error = ErrorMiddleware.createError(
            'Username already taken',
            409,
            'USERNAME_TAKEN'
          );
          throw error;
        }
      }

      const updatedUser = await db.prisma.user.update({
        where: { id: req.user.userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(username !== undefined && { username }),
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          userType: true,
          subscriptionTier: true,
          isVerified: true,
          updatedAt: true,
        },
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}