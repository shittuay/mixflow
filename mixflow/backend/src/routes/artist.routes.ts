import { Router } from 'express';
import { ArtistController } from '../controllers/artist.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { CreateArtistDto } from '../dto/artist.dto';

const router = Router();

router.post('/create',
  AuthMiddleware.authenticate,
  ValidationMiddleware.validateBody(CreateArtistDto),
  ArtistController.createProfile
);

router.get('/tracks',
  AuthMiddleware.authenticate,
  ArtistController.getTracks
);

router.get('/:id',
  ArtistController.getProfile
);

export const artistRoutes = router;