# MixFlow Backend API

A refactored, production-ready Express.js API for the MixFlow music streaming and DJ platform.

## 🚀 Features

- **Modular Architecture**: Clean separation of concerns with controllers, services, middleware
- **Type Safety**: Full TypeScript support with strict type checking
- **Input Validation**: DTO validation using class-validator
- **Security**: Helmet, CORS, JWT authentication, bcrypt password hashing
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **File Uploads**: Secure audio and artwork upload handling
- **Database**: Prisma ORM with PostgreSQL
- **Environment Configuration**: Proper environment variable management

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── environment.config.ts
│   │   └── upload.config.ts
│   ├── controllers/      # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── artist.controller.ts
│   │   └── track.controller.ts
│   ├── dto/             # Data Transfer Objects
│   │   ├── auth.dto.ts
│   │   ├── artist.dto.ts
│   │   └── track.dto.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/          # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── artist.routes.ts
│   │   ├── track.routes.ts
│   │   └── index.ts
│   ├── services/        # Business logic services
│   │   └── database.service.ts
│   ├── utils/           # Utility functions
│   │   └── jwt.util.ts
│   └── main.ts          # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env.example         # Environment variables template
└── README.md
```

## 🛠️ Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Build & Start**
   ```bash
   # Development
   npx nx serve backend

   # Production build
   npx nx build backend
   ```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3333` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000,http://localhost:4200` |
| `UPLOAD_MAX_SIZE` | Max file upload size | `104857600` (100MB) |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/user/profile` - Get user profile (auth required)
- `PATCH /api/user/profile` - Update user profile (auth required)

### Artist Management
- `POST /api/artist/create` - Create artist profile (auth required)
- `GET /api/artist/tracks` - Get artist tracks (auth required)
- `GET /api/artist/:id` - Get public artist profile

### Track Management
- `POST /api/tracks/upload` - Upload track (auth required, artist only)
- `GET /api/tracks` - Get public tracks
- `GET /api/tracks/:id` - Get track details
- `GET /api/tracks/:id/stream` - Stream track

### System
- `GET /api` - API information
- `GET /health` - Health check

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **Input Validation**: DTO validation with class-validator
- **CORS Protection**: Configurable origin allowlist
- **Helmet**: Security headers
- **File Upload Security**: MIME type and extension validation
- **Error Handling**: No sensitive information in error responses

## 🎯 Key Improvements from Original

1. **Modular Architecture**: Split 500+ line monolith into focused modules
2. **Type Safety**: Eliminated `any` types, added proper TypeScript
3. **Security**: Fixed hardcoded JWT secret, added proper validation
4. **Error Handling**: Comprehensive error middleware with proper codes
5. **Validation**: Added DTO validation for all endpoints
6. **Configuration**: Environment-based configuration management
7. **Database**: Singleton pattern for Prisma client with health checks
8. **File Uploads**: Improved security and error handling
9. **Logging**: Structured logging with environment-based levels
10. **Graceful Shutdown**: Proper cleanup on termination

## 🧪 Testing

```bash
# Unit tests
npx nx test backend

# E2E tests
npx nx e2e backend-e2e
```

## 📦 Build & Deploy

```bash
# Production build
npx nx build backend

# The built files will be in dist/backend/
# Copy package.json and run: npm ci --omit=dev
```

## 🚨 Security Notes

- Never commit `.env` files
- Always use `JWT_SECRET` in production
- Configure `DATABASE_URL` with proper credentials
- Set appropriate `CORS_ORIGINS` for production
- Use HTTPS in production
- Regularly update dependencies

## 📈 Performance

- Compression middleware enabled
- Static file caching in production
- Efficient database queries with Prisma
- Connection pooling via DATABASE_URL
- File upload size limits