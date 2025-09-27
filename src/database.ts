// Simple SQLite database configuration
// This replaces the complex Prisma setup for easier installation

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
import path from 'path';

// Database connection
let db: any = null;

export async function initDatabase() {
    if (!db) {
        db = await open({
            filename: path.join(process.cwd(), 'pastebin.db'),
            driver: sqlite3.Database
        });
        
        // Enable foreign keys
        await db.exec('PRAGMA foreign_keys = ON;');
        
        console.log('✅ SQLite database connected');
    }
    return db;
}

export async function getDatabase() {
    if (!db) {
        await initDatabase();
    }
    return db;
}

// Helper functions for common operations
export const dbHelpers = {
    async createPaste(data: {
        id: string;
        title?: string;
        content: string;
        language?: string;
        expiresAt?: Date;
        isPublic: boolean;
        ipAddress?: string;
    }) {
        const db = await getDatabase();
        return await db.run(
            `INSERT INTO pastes (id, title, content, language, expires_at, is_public, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [data.id, data.title, data.content, data.language, data.expiresAt, data.isPublic ? 1 : 0, data.ipAddress]
        );
    },

    async getPaste(id: string) {
        const db = await getDatabase();
        return await db.get('SELECT * FROM pastes WHERE id = ? AND is_deleted = 0', [id]);
    },

    async getRecentPastes(limit = 20) {
        const db = await getDatabase();
        return await db.all(
            `SELECT * FROM pastes 
             WHERE is_public = 1 AND is_deleted = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
             ORDER BY created_at DESC LIMIT ?`,
            [limit]
        );
    },

    async searchPastes(query: string, language?: string, limit = 20, offset = 0) {
        const db = await getDatabase();
        let sql = `
            SELECT * FROM pastes 
            WHERE is_public = 1 AND is_deleted = 0 AND (expires_at IS NULL OR expires_at > datetime('now'))
        `;
        const params: any[] = [];

        if (query) {
            sql += ` AND (title LIKE ? OR content LIKE ?)`;
            params.push(`%${query}%`, `%${query}%`);
        }

        if (language) {
            sql += ` AND language = ?`;
            params.push(language);
        }

        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return await db.all(sql, params);
    },

    async incrementViews(id: string) {
        const db = await getDatabase();
        return await db.run('UPDATE pastes SET views = views + 1 WHERE id = ?', [id]);
    },

    async deletePaste(id: string) {
        const db = await getDatabase();
        return await db.run('UPDATE pastes SET is_deleted = 1 WHERE id = ?', [id]);
    },

    async logActivity(data: {
        action: string;
        pasteId?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: any;
    }) {
        const db = await getDatabase();
        return await db.run(
            `INSERT INTO activity_logs (action, paste_id, ip_address, user_agent, metadata) 
             VALUES (?, ?, ?, ?, ?)`,
            [data.action, data.pasteId, data.ipAddress, data.userAgent, JSON.stringify(data.metadata)]
        );
    },

    async getStats() {
        const db = await getDatabase();
        
        const [total, views, today, expired] = await Promise.all([
            db.get('SELECT COUNT(*) as count FROM pastes WHERE is_deleted = 0'),
            db.get('SELECT SUM(views) as total FROM pastes WHERE is_deleted = 0'),
            db.get(`SELECT COUNT(*) as count FROM pastes 
                   WHERE is_deleted = 0 AND date(created_at) = date('now')`),
            db.get(`SELECT COUNT(*) as count FROM pastes 
                   WHERE expires_at IS NOT NULL AND expires_at < datetime('now')`)
        ]);

        return {
            totalPastes: total.count || 0,
            totalViews: views.total || 0,
            pastesToday: today.count || 0,
            expiredPastes: expired.count || 0
        };
    },

    async getActivityLogs(limit = 50) {
        const db = await getDatabase();
        return await db.all(
            `SELECT * FROM activity_logs 
             ORDER BY timestamp DESC LIMIT ?`,
            [limit]
        );
    },

    async getAllPastes(limit = 50, offset = 0) {
        const db = await getDatabase();
        return await db.all(
            `SELECT * FROM pastes 
             ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );
    },

    async cleanupExpired() {
        const db = await getDatabase();
        return await db.run(
            `UPDATE pastes SET is_deleted = 1 
             WHERE expires_at IS NOT NULL AND expires_at < datetime('now') AND is_deleted = 0`
        );
    }
};