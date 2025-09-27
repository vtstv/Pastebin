import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const sanitizeContent = (content: string): string => {
  // Basic sanitization - in production, use a proper library like DOMPurify
  return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const detectLanguage = (content: string): string | null => {
  // Simple language detection based on common patterns
  const patterns = {
    javascript: /(?:function|const|let|var|=>|console\.log)/i,
    python: /(?:def |import |from |print\(|if __name__)/i,
    java: /(?:public class|public static void|import java)/i,
    cpp: /(?:#include|using namespace|std::|cout|cin)/i,
    html: /(?:<html|<head|<body|<div|<script)/i,
    css: /(?:\{[\s\S]*\}|@media|@import)/i,
    sql: /(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)/i,
    json: /^\s*[\{\[]/,
    xml: /^\s*<\?xml|<[a-zA-Z]/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      return lang;
    }
  }

  return null;
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const getClientIp = (req: any): string => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] || 
         'unknown';
};

export const truncateText = (text: string, length = 100): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
};

/**
 * Format paste content with line numbers
 * @param content - The paste content as a string
 * @returns String with each line prefixed with its line number
 */
export const formatWithLineNumbers = (content: string): string => {
  if (!content) return '';
  
  const lines = content.split('\n');
  return lines.map((line, index) => {
    const lineNumber = index + 1;
    return `${lineNumber} ${line}`;
  }).join('\n');
};