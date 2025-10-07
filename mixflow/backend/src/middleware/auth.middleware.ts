import { Request, Response, NextFunction } from 'express';
import { JwtUtil, JwtPayload } from '../utils/jwt.util';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  static authenticate(req: Request, res: Response, next: NextFunction): void {
    try {
      const token = JwtUtil.extractTokenFromHeader(req.headers.authorization);

      if (!token) {
        res.status(401).json({ 
          error: 'Access token required',
          code: 'MISSING_TOKEN'
        });
        return;
      }

      const payload = JwtUtil.verifyToken(token);
      req.user = payload;
      next();
    } catch (error: any) {
      res.status(403).json({ 
        error: error.message || 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  }

  static requireUserType(userType: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      if (req.user.userType !== userType) {
        res.status(403).json({ 
          error: `Access denied. Required user type: ${userType}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    };
  }

  static requireAnyUserType(userTypes: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
        return;
      }

      if (!userTypes.includes(req.user.userType)) {
        res.status(403).json({ 
          error: `Access denied. Required user types: ${userTypes.join(', ')}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
        return;
      }

      next();
    };
  }
}