import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
const session = require('express-session');
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';

import { DatabaseService } from './services/DatabaseService';
import { createPasteRoutes } from './routes/paste';
import { createAdminRoutes } from './routes/admin';
import { loggerMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new DatabaseService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

app.use(cors());

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Rate limiting - disabled in development, increased limits in production
if (process.env.NODE_ENV !== 'development') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 10x increased from 100 to 1000
    message: 'Too many requests from this IP, please try again later.'
  });
  
  app.use(limiter);
  console.log('Rate limiting enabled for production');
} else {
  console.log('Rate limiting disabled for development');
}

// Logging - exclude static files
app.use(morgan('combined', {
  skip: (req: any, res: any) => {
    const url = req.originalUrl;
    return url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/) ||
           url.includes('favicon');
  }
}));
app.use(loggerMiddleware(db));

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Routes
app.use('/', createPasteRoutes(db));
app.use('/admin', createAdminRoutes(db));

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Cleanup expired pastes every hour
setInterval(async () => {
  try {
    const count = await db.cleanupExpiredPastes();
    if (count > 0) {
      console.log(`Cleaned up ${count} expired pastes`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60 * 60 * 1000); // 1 hour

// Start server
const startServer = async () => {
  try {
    await db.connect();
    console.log('Connected to database');
    
    app.listen(PORT, () => {
      console.log(`Advanced Pastebin server running on http://localhost:${PORT}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

startServer();