# Advanced Pastebin - Development Container

This development container is configured for the Advanced Pastebin by Murr.

## What's Included

- **Node.js 20 LTS** - Latest stable Node.js version
- **TypeScript** - Full TypeScript support with latest version
- **SQLite3** - Database for local development
- **Prisma** - Database ORM and migration tools
- **Development Tools**: ESLint, Prettier, ts-node-dev

## Project Structure

This is a TypeScript/Node.js pastebin service with:

- Express.js server with EJS templating
- SQLite database with Prisma ORM
- GitHub-inspired UI with dark/light themes
- Admin panel with activity logging
- Syntax highlighting and line numbers
- Rate limiting and security features

## Getting Started

1. The container will automatically run `npm install` after creation
2. Start the development server: `npm run dev`
3. Access the application at http://localhost:3000
4. Admin panel available at http://localhost:3000/admin

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Environment

- SQLite database: `pastebin.db` (created automatically)
- Port forwarding: 3000 (Pastebin Server)
- Working directory: `/workspaces/DockerVscode`
