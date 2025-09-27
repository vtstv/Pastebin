# Advanced Pastebin

A modern, GitHub-style pastebin service built with TypeScript, Express.js, and SQLite.

<img width="2463" height="1249" alt="image" src="https://github.com/user-attachments/assets/49840d81-cffb-4686-ab00-d862c690e85b" />

<img width="1901" height="1094" alt="image" src="https://github.com/user-attachments/assets/42e2ba7e-4ffa-462e-bbb3-d09a9337568b" />


## Features

- 📝 **Modern UI**: GitHub-inspired design with dark/light theme toggle
- 🎨 **Syntax Highlighting**: Support for multiple programming languages
- � **Line Numbers**: Toggle-able pink line numbers with copy functionality
- � **Admin Panel**: Comprehensive management and activity logging
- 🗄️ **Database**: SQLite with Prisma ORM for easy development
- 🔒 **Security**: Rate limiting, CSP headers, and XSS protection
- 📱 **Responsive**: Mobile-friendly navigation and layout
- 🔍 **Search**: Full-text search with SQLite compatibility

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Automated setup (recommended)
npm run db:setup

# Or manual setup
sqlite3 pastebin.db < schema.sql
npm run db:generate
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
DATABASE_URL="file:./pastebin.db"
PORT=3000
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
NODE_ENV=development
```

### 4. Run the Application

```bash
   npm install
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on http://localhost:3000

## Configuration

- **Port**: Set via `PORT` environment variable (default: 3000)
- **Storage**: Currently uses in-memory storage. For production, consider using a database.

## Notes

- Consider adding rate limiting and input validation for production
- HTTPS is recommended for production deployment

## Credits

**Pastebin by Murr**

- Author: [Murr (vtstv)](https://github.com/vtstv)

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Murr (vtstv)
