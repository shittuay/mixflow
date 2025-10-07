import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  userType: string;
}

export class JwtUtil {
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  static generateToken(user: Pick<User, 'id' | 'email' | 'userType'>): string {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): JwtPayload {
    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
}