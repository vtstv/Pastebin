import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/auth';

export const createAdminRoutes = (db: DatabaseService): Router => {
  const router = Router();
  const adminController = new AdminController(db);

  // Auth routes
  router.post('/login', adminController.login);
  router.post('/logout', authMiddleware, adminController.logout);

  // Admin panel routes (protected)
  router.get('/dashboard', authMiddleware, adminController.getDashboard);
  router.get('/pastes', authMiddleware, adminController.getPastes);
  router.delete('/pastes/:id', authMiddleware, adminController.deletePaste);
  router.get('/logs', authMiddleware, adminController.getLogs);
  router.post('/cleanup', authMiddleware, adminController.cleanupExpired);

  // Admin panel views
  router.get('/', (req, res) => {
    // Check if user is authenticated, if not redirect to login
    const token = (req.session as any)?.token;
    if (!token) {
      res.redirect('/admin/login');
      return;
    }
    // Verify token is valid
    try {
      const { verifyToken } = require('../utils/helpers');
      verifyToken(token);
      res.redirect('/admin/dashboard');
    } catch (error) {
      res.redirect('/admin/login');
    }
  });

  router.get('/login', (req, res) => {
    res.render('admin/login');
  });

  return router;
};