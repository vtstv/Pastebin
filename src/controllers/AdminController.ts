import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { hashPassword, comparePassword, generateToken, getClientIp } from '../utils/helpers';

export class AdminController {
  constructor(private db: DatabaseService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password required' });
        return;
      }

      // For simplicity, using environment variables for admin credentials
      // In production, use database with hashed passwords
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      if (username !== adminUsername || password !== adminPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = generateToken({ username, role: 'admin' });
      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');

      await this.db.logAccess('ADMIN_LOGIN', ip, userAgent, undefined, { username });

      // Store token in session
      if (req.session) {
        (req.session as any).token = token;
        (req.session as any).admin = { username, role: 'admin' };
      }

      res.json({ success: true, token });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err);
          }
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  };

  getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const stats = await this.db.getAdminStats();
      res.render('admin/dashboard', { stats, admin: req.admin });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).render('error', { message: 'Failed to load dashboard' });
    }
  };

  getPastes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.db.getAllPastes(page, limit);
      res.render('admin/pastes', { result, admin: req.admin });
    } catch (error) {
      console.error('Get pastes error:', error);
      res.status(500).render('error', { message: 'Failed to load pastes' });
    }
  };

  deletePaste = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      console.log('Delete paste request:', { id, admin: req.admin?.username });
      
      if (!id) {
        console.log('Invalid paste ID provided');
        res.status(400).json({ error: 'Invalid paste ID' });
        return;
      }
      
      const success = await this.db.deletePaste(id);
      console.log('Delete operation result:', success);

      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');
      await this.db.logAccess('DELETE_PASTE', ip, userAgent, id, { admin: req.admin?.username });

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Paste not found' });
      }
    } catch (error) {
      console.error('Delete paste error:', error);
      res.status(500).json({ error: 'Failed to delete paste' });
    }
  };

  getLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await this.db.getAccessLogs(page, limit);
      res.render('admin/logs', { result, admin: req.admin });
    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).render('error', { message: 'Failed to load logs' });
    }
  };

  cleanupExpired = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const count = await this.db.cleanupExpiredPastes();
      
      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');
      await this.db.logAccess('ADMIN_ACTION', ip, userAgent, undefined, { 
        action: 'cleanup_expired',
        admin: req.admin?.username,
        count 
      });

      res.json({ success: true, count });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ error: 'Cleanup failed' });
    }
  };
}