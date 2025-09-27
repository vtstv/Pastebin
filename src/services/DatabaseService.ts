import { PrismaClient, Paste, AccessLog } from '@prisma/client';
import { CreatePasteRequest, SearchQuery, LogAction, PaginatedResult } from '../types';

export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Paste operations
  async createPaste(data: CreatePasteRequest & { creatorIp?: string; userAgent?: string }): Promise<Paste> {
    const expiresAt = data.expiryHours 
      ? new Date(Date.now() + data.expiryHours * 60 * 60 * 1000)
      : null;

    return this.prisma.paste.create({
      data: {
        title: data.title,
        content: data.content,
        language: data.language,
        password: data.password,
        expiresAt,
        isPublic: data.isPublic ?? true,
        creatorIp: data.creatorIp,
        userAgent: data.userAgent,
      },
    });
  }

  async getPasteById(id: string, incrementViews = false): Promise<Paste | null> {
    const paste = await this.prisma.paste.findFirst({
      where: {
        id,
        isDeleted: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (paste && incrementViews) {
      await this.prisma.paste.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      paste.views += 1;
    }

    return paste;
  }

  async searchPastes(query: SearchQuery): Promise<PaginatedResult<Paste>> {
    const {
      query: searchQuery,
      language,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause more carefully for SQLite
    const where: any = {
      isDeleted: false,
      isPublic: true,
    };

    // Add expiration check
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

    // Add search query if provided
    if (searchQuery && searchQuery.trim()) {
      where.AND = [
        {
          OR: [
            { title: { contains: searchQuery } },
            { content: { contains: searchQuery } },
          ],
        },
      ];
    }

    // Add language filter if provided
    if (language) {
      where.language = language;
    }

    try {
      const [data, total] = await Promise.all([
        this.prisma.paste.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        }),
        this.prisma.paste.count({ where }),
      ]);

      return {
        data,
        total,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Search error:', error);
      // Return empty result on error
      return {
        data: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
      };
    }
  }

  async getRecentPastes(limit = 10): Promise<Paste[]> {
    return this.prisma.paste.findMany({
      where: {
        isDeleted: false,
        isPublic: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deletePaste(id: string): Promise<boolean> {
    try {
      await this.prisma.paste.update({
        where: { id },
        data: { isDeleted: true },
      });
      return true;
    } catch {
      return false;
    }
  }

  async cleanupExpiredPastes(): Promise<number> {
    const result = await this.prisma.paste.updateMany({
      where: {
        expiresAt: { lte: new Date() },
        isDeleted: false,
      },
      data: { isDeleted: true },
    });
    return result.count;
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    const [totalPastes, totalViews, pastesToday, expiredPastes, recentActivity] = await Promise.all([
      this.prisma.paste.count({ where: { isDeleted: false } }),
      this.prisma.paste.aggregate({
        where: { isDeleted: false },
        _sum: { views: true },
      }),
      this.prisma.paste.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          isDeleted: false,
        },
      }),
      this.prisma.paste.count({
        where: {
          expiresAt: { lte: new Date() },
          isDeleted: false,
        },
      }),
      this.prisma.accessLog.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      totalPastes,
      totalViews: totalViews._sum.views || 0,
      pastesToday,
      expiredPastes,
      recentActivity,
    };
  }

  async getAllPastes(page = 1, limit = 20): Promise<PaginatedResult<Paste>> {
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.paste.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.paste.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Logging
  async logAccess(
    action: LogAction,
    ipAddress: string,
    userAgent?: string,
    pasteId?: string,
    metadata?: any
  ): Promise<void> {
    await this.prisma.accessLog.create({
      data: {
        action,
        ipAddress,
        userAgent,
        pasteId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  async getAccessLogs(page = 1, limit = 50): Promise<PaginatedResult<AccessLog>> {
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.accessLog.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin user management
  async createAdmin(username: string, password: string, email?: string): Promise<any> {
    return this.prisma.admin.create({
      data: {
        username,
        password,
        email,
      },
    });
  }

  async getAdminByUsername(username: string): Promise<any> {
    return this.prisma.admin.findUnique({
      where: { username },
    });
  }

  async updateAdminLastLogin(id: string): Promise<void> {
    await this.prisma.admin.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }
}