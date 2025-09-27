import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/helpers';

declare global {
  namespace Express {
    interface Request {
      admin?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  admin?: any;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = (req.session as any)?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

export const loggerMiddleware = (db: any) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';
      
      // Only log meaningful user actions, not static files or frequent requests
      const shouldLog = shouldLogRequest(req, res);
      
      if (!shouldLog) {
        return;
      }
      
      try {
        await db.logAccess(
          getActionType(req),
          ip,
          userAgent,
          extractPasteId(req),
          {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
          }
        );
      } catch (error) {
        console.error('Failed to log request:', error);
      }
    });

    next();
  };
};

// Helper function to determine if a request should be logged
function shouldLogRequest(req: Request, res: Response): boolean {
  const url = req.originalUrl;
  const method = req.method;
  const statusCode = res.statusCode;
  
  // Don't log static file requests
  if (url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return false;
  }
  
  // Don't log favicon requests
  if (url.includes('favicon')) {
    return false;
  }
  
  // Don't log successful OPTIONS requests
  if (method === 'OPTIONS' && statusCode < 400) {
    return false;
  }
  
  // Don't log health check or ping requests
  if (url.match(/\/(health|ping|status)\/?$/)) {
    return false;
  }
  
  // Log all other requests (page visits, API calls, form submissions)
  return true;
}

// Helper function to get action type based on request
function getActionType(req: Request): string {
  const url = req.originalUrl;
  const method = req.method;
  
  if (url.startsWith('/admin')) {
    if (method === 'DELETE') return 'ADMIN_DELETE';
    if (method === 'POST') return 'ADMIN_ACTION';
    return 'ADMIN_VIEW';
  }
  
  if (url.startsWith('/api/search')) return 'SEARCH_API';
  if (url.startsWith('/api/pastes') && method === 'POST') return 'CREATE_PASTE';
  if (url.startsWith('/paste/')) return 'VIEW_PASTE';
  if (url.startsWith('/search')) return 'SEARCH_PAGE';
  if (url === '/' || url === '/index') return 'VIEW_HOME';
  
  return 'PAGE_VIEW';
}

// Helper function to extract paste ID from URL if present
function extractPasteId(req: Request): string | undefined {
  const match = req.originalUrl.match(/\/(paste|api\/pastes)\/([a-zA-Z0-9_-]+)/);
  return match ? match[2] : undefined;
}