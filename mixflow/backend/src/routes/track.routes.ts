import { Router } from 'express';
import { TrackController } from '../controllers/track.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { UploadConfig } from '../config/upload.config';
import { UploadTrackDto, GetTracksDto } from '../dto/track.dto';

const router = Router();
const upload = UploadConfig.getMulterConfig();

router.post('/upload',
  AuthMiddleware.authenticate,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'artwork', maxCount: 1 }
  ]),
  ValidationMiddleware.validateBody(UploadTrackDto),
  TrackController.upload
);

router.get('/',
  ValidationMiddleware.validateQuery(GetTracksDto),
  TrackController.getAll
);

router.get('/:id',
  TrackController.getById
);

router.get('/:id/stream',
  TrackController.stream
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  TrackController.delete
);

export const trackRoutes = router;