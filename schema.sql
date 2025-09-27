-- Advanced Pastebin - SQLite Database Schema
-- Generated from Prisma schema for production deployment
-- Run with: sqlite3 pastebin.db < schema.sql

-- Main pastes table
CREATE TABLE IF NOT EXISTS "pastes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "creatorIp" TEXT,
    "userAgent" TEXT
);

-- Admin users table
CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Access logs table for activity tracking
CREATE TABLE IF NOT EXISTS "access_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pasteId" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "pastes_createdAt_idx" ON "pastes"("createdAt");
CREATE INDEX IF NOT EXISTS "pastes_isDeleted_isPublic_idx" ON "pastes"("isDeleted", "isPublic");
CREATE INDEX IF NOT EXISTS "pastes_expiresAt_idx" ON "pastes"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "admins_username_key" ON "admins"("username");
CREATE INDEX IF NOT EXISTS "access_logs_timestamp_idx" ON "access_logs"("timestamp");
CREATE INDEX IF NOT EXISTS "access_logs_action_idx" ON "access_logs"("action");
CREATE INDEX IF NOT EXISTS "access_logs_pasteId_idx" ON "access_logs"("pasteId");

-- Sample data for demonstration (optional - remove for production)
INSERT OR IGNORE INTO "pastes" ("id", "title", "content", "language", "isPublic") VALUES 
('demo_paste_001', 'Welcome to Advanced Pastebin', 'console.log("Hello, World! Welcome to Advanced Pastebin by Murr");

// This is a demonstration paste
// Features:
// - Syntax highlighting
// - Line numbers (toggle with button)
// - Dark/Light themes
// - Search functionality
// - Admin panel
// - SQLite database with Prisma ORM

function welcomeMessage() {
    return "Enjoy using Advanced Pastebin!";
}

welcomeMessage();', 'javascript', true);

-- Note: Create admin user via application interface
-- Default credentials can be set in .env file