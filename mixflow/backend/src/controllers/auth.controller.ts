import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/database.service';
import { JwtUtil } from '../utils/jwt.util';
import { ErrorMiddleware } from '../middleware/error.middleware';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, password, userType = 'LISTENER' } = req.body as RegisterDto;

      // Check if user already exists
      const existingUser = await db.prisma.user.findFirst({
        where: { 
          OR: [{ email }, { username }] 
        },
      });

      if (existingUser) {
        const error = ErrorMiddleware.createError(
          'Email or username already in use',
          409,
          'USER_ALREADY_EXISTS'
        );
        throw error;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await db.prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          userType,
        },
        select: {
          id: true,
          email: true,
          username: true,
          userType: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = JwtUtil.generateToken({
        id: user.id,
        email: user.email,
        userType: user.userType,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginDto;

      // Find user
      const user = await db.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          userType: true,
          passwordHash: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        const error = ErrorMiddleware.createError(
          'Invalid credentials',
          401,
          'INVALID_CREDENTIALS'
        );
        throw error;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        const error = ErrorMiddleware.createError(
          'Invalid credentials',
          401,
          'INVALID_CREDENTIALS'
        );
        throw error;
      }

      // Generate token
      const token = JwtUtil.generateToken({
        id: user.id,
        email: user.email,
        userType: user.userType,
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          userType: user.userType,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}