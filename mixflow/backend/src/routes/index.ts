import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { artistRoutes } from './artist.routes';
import { trackRoutes } from './track.routes';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MixFlow API!',
    version: '2.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: [
        'POST /api/auth/register',
        'POST /api/auth/login'
      ],
      user: [
        'GET /api/user/profile',
        'PATCH /api/user/profile'
      ],
      artist: [
        'POST /api/artist/create',
        'GET /api/artist/tracks',
        'GET /api/artist/:id'
      ],
      tracks: [
        'POST /api/tracks/upload',
        'GET /api/tracks',
        'GET /api/tracks/:id',
        'GET /api/tracks/:id/stream'
      ]
    }
  });
});

// API Routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/artist', artistRoutes);
router.use('/tracks', trackRoutes);

export const apiRoutes = router;