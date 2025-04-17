# Buy EU Server

This server application supports deployment to both Cloudflare Workers and Vercel.

## Project Structure

- `/src` - Core application code
  - `/handlers` - Request handlers and routing logic
  - `/errors` - Error handling
  - `/utils` - Utility functions
- `/api` - Vercel API endpoints

## Deployment Options

### Cloudflare Workers (Original)

```bash
# Development
npm run dev

# Deployment
npm run deploy
```

### Vercel (New)

```bash
# Development
npm run dev:vercel

# Deployment
npm run deploy:vercel
```

## Environment Variables

The following environment variables need to be set in your Vercel project:

- `MONGODB_URI`: Connection string for your MongoDB database

## Making Changes

- The core application logic is in the `/src` directory
- API routes for Vercel are in the `/api` directory
- Routes are defined in `/src/handlers/router.ts`
- Route handlers are in `/src/handlers/routes/`

## Vercel Deployment Instructions

1. Link your repository to Vercel through the Vercel dashboard
2. Set up the required environment variables
3. Deploy using the Vercel dashboard or `npm run deploy:vercel`

The application uses a catchall API route to handle all endpoints defined in your router, preserving the existing routing structure.
