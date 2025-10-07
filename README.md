# MixFlow

A music streaming and DJ platform built with React, Node.js, and Prisma.

## Features

- 🎵 Music streaming with separate music and podcast sections
- 🎧 DJ Mode with dual deck mixing
- 👤 User authentication (Artist, DJ, Listener roles)
- 📤 Track upload with metadata
- 🎨 Real-time waveform visualization
- 🎛️ BPM detection and key matching
- 📊 Analytics and streaming stats

## Tech Stack

### Frontend
- React with TypeScript
- Vite
- Tailwind CSS
- Lucide React Icons

### Backend
- Node.js with Express
- Prisma ORM
- SQLite database
- JWT authentication
- Multer for file uploads

### Monorepo
- Nx for workspace management

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/shittuay/mixflow.git
cd mixflow
```

2. Install dependencies
```bash
npm install
```

3. Set up backend environment variables
```bash
cd mixflow/backend
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database
```bash
cd mixflow/backend
npx prisma migrate dev
npx prisma generate
```

5. Start the development servers

**Backend:**
```bash
npm run dev:backend
# or
cd mixflow && npx nx run backend:serve
```

**Frontend:**
```bash
npm run dev:frontend
# or
cd mixflow && npx nx run web-app:serve
```

The frontend will be available at `http://localhost:4200`
The backend API will be available at `http://localhost:3334`

## Deployment

### Backend (Render)
The backend is configured to deploy to Render using the `render.yaml` file.

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Render will auto-detect the configuration
4. Set environment variables in the Render dashboard

### Frontend (Netlify)
The frontend is configured to deploy to Netlify using the `netlify.toml` file.

1. Create a new site on Netlify
2. Connect your GitHub repository
3. Netlify will auto-detect the configuration
4. Set the `VITE_API_URL` environment variable to your backend URL

## Project Structure

```
mixflow/
├── mixflow/
│   ├── backend/          # Express.js API
│   │   ├── src/
│   │   │   ├── config/   # Configuration files
│   │   │   ├── controllers/ # Route controllers
│   │   │   ├── middleware/  # Express middleware
│   │   │   ├── routes/   # API routes
│   │   │   └── services/ # Business logic
│   │   └── prisma/       # Database schema
│   ├── web-app/          # React frontend
│   │   └── src/
│   │       ├── app/      # Main application
│   │       ├── components/ # React components
│   │       └── config/   # Frontend configuration
│   └── shared/           # Shared utilities
├── netlify.toml          # Netlify deployment config
└── render.yaml           # Render deployment config
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
