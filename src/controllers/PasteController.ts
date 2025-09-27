import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { getClientIp, detectLanguage, sanitizeContent } from '../utils/helpers';
import { CreatePasteRequest } from '../types';

export class PasteController {
  constructor(private db: DatabaseService) {}

  createPaste = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, content, language, password, expiryHours, isPublic }: CreatePasteRequest = req.body;

      if (!content || content.trim() === '') {
        res.status(400).json({ error: 'Content cannot be empty' });
        return;
      }

      if (content.length > (process.env.MAX_PASTE_LENGTH ? parseInt(process.env.MAX_PASTE_LENGTH) : 1000000)) {
        res.status(400).json({ error: 'Content too long' });
        return;
      }

      const sanitizedContent = sanitizeContent(content);
      const detectedLanguage = language || detectLanguage(sanitizedContent);
      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');

      const paste = await this.db.createPaste({
        title,
        content: sanitizedContent,
        language: detectedLanguage || undefined,
        password,
        expiryHours: expiryHours || (process.env.DEFAULT_EXPIRY_HOURS ? parseInt(process.env.DEFAULT_EXPIRY_HOURS) : 24),
        isPublic: isPublic ?? true,
        creatorIp: ip,
        userAgent,
      });

      await this.db.logAccess('CREATE_PASTE', ip, userAgent, paste.id);

      res.json({
        success: true,
        id: paste.id,
        url: `/paste/${paste.id}`,
      });
    } catch (error) {
      console.error('Error creating paste:', error);
      res.status(500).json({ error: 'Failed to create paste' });
    }
  };

  getPaste = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).render('error', { message: 'Invalid paste ID' });
        return;
      }
      const paste = await this.db.getPasteById(id, true);

      if (!paste) {
        res.status(404).render('error', { message: 'Paste not found or has expired' });
        return;
      }

      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');
      await this.db.logAccess('VIEW_PASTE', ip, userAgent, paste.id);

      res.render('paste', { paste });
    } catch (error) {
      console.error('Error getting paste:', error);
      res.status(500).render('error', { message: 'Internal server error' });
    }
  };

  getRawPaste = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).send('Invalid paste ID');
        return;
      }
      const paste = await this.db.getPasteById(id, true);

      if (!paste) {
        res.status(404).send('Paste not found or has expired');
        return;
      }

      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');
      await this.db.logAccess('VIEW_PASTE', ip, userAgent, paste.id, { type: 'raw' });

      res.set('Content-Type', 'text/plain');
      res.send(paste.content);
    } catch (error) {
      console.error('Error getting raw paste:', error);
      res.status(500).send('Internal server error');
    }
  };

  getPasteApi = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'Invalid paste ID' });
        return;
      }
      const paste = await this.db.getPasteById(id);

      if (!paste) {
        res.status(404).json({ error: 'Paste not found' });
        return;
      }

      res.json({
        id: paste.id,
        title: paste.title,
        content: paste.content,
        language: paste.language,
        createdAt: paste.createdAt,
        expiresAt: paste.expiresAt,
        views: paste.views,
        isPublic: paste.isPublic,
        hasPassword: !!paste.password,
      });
    } catch (error) {
      console.error('Error getting paste API:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  searchPastes = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        q: query,
        language,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const result = await this.db.searchPastes({
        query: query as string,
        language: language as string,
        limit: limitNum,
        offset,
        sortBy: sortBy as 'createdAt' | 'views',
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');
      await this.db.logAccess('SEARCH_PASTE', ip, userAgent, undefined, { query, language });

      res.render('search', { 
        result, 
        query: {
          q: query,
          language,
          page: pageNum,
          limit: limitNum,
          sortBy,
          sortOrder
        }
      });
    } catch (error) {
      console.error('Error searching pastes:', error);
      res.status(500).render('error', { message: 'Search failed' });
    }
  };

  searchPastesApi = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        q: query,
        language,
        limit = '5',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      if (!query || (query as string).trim().length < 2) {
        res.json({ results: [] });
        return;
      }

      const limitNum = Math.min(parseInt(limit as string), 10); // Max 10 results for API

      const result = await this.db.searchPastes({
        query: query as string,
        language: language as string,
        limit: limitNum,
        offset: 0,
        sortBy: sortBy as 'createdAt' | 'views',
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      const ip = getClientIp(req);
      const userAgent = req.get('user-agent');
      await this.db.logAccess('SEARCH_PASTE', ip, userAgent, undefined, { query, language, api: true });

      res.json({ 
        results: result.data.map(paste => ({
          id: paste.id,
          title: paste.title,
          language: paste.language,
          createdAt: paste.createdAt,
          views: paste.views,
          content: paste.content.substring(0, 200) // Only send first 200 chars for preview
        }))
      });
    } catch (error) {
      console.error('Error searching pastes (API):', error);
      res.status(500).json({ error: 'Search failed' });
    }
  };

  getRecentPastes = async (req: Request, res: Response): Promise<void> => {
    try {
      const pastes = await this.db.getRecentPastes(20);
      res.render('recent', { pastes });
    } catch (error) {
      console.error('Error getting recent pastes:', error);
      res.status(500).render('error', { message: 'Failed to load recent pastes' });
    }
  };
}