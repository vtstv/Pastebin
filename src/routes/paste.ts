import { Router } from 'express';
import { PasteController } from '../controllers/PasteController';
import { DatabaseService } from '../services/DatabaseService';

export const createPasteRoutes = (db: DatabaseService): Router => {
  const router = Router();
  const pasteController = new PasteController(db);

  // Web routes
  router.get('/', (req, res) => {
    res.render('index');
  });

  router.get('/paste/:id', pasteController.getPaste);
  router.get('/raw/:id', pasteController.getRawPaste);
  router.get('/recent', pasteController.getRecentPastes);
  router.get('/search', pasteController.searchPastes);

  // API routes
  router.post('/paste', pasteController.createPaste);
  router.get('/api/paste/:id', pasteController.getPasteApi);
  router.get('/api/search', pasteController.searchPastesApi);

  return router;
};