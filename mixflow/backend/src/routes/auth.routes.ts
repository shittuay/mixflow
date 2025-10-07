import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

const router = Router();

router.post('/register', 
  ValidationMiddleware.validateBody(RegisterDto),
  AuthController.register
);

router.post('/login', 
  ValidationMiddleware.validateBody(LoginDto),
  AuthController.login
);

export const authRoutes = router;