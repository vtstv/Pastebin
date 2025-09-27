#!/bin/bash
# Advanced Pastebin - Database Setup Script
# This script creates a clean SQLite database for production deployment

set -e  # Exit on any error

echo "🗄️  Advanced Pastebin - Database Setup"
echo "======================================"

# Configuration
DB_FILE="pastebin.db"
BACKUP_DIR="database_backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup existing database if it exists
if [ -f "$DB_FILE" ]; then
    BACKUP_NAME="$BACKUP_DIR/pastebin_backup_$(date +%Y%m%d_%H%M%S).db"
    echo "📦 Backing up existing database to: $BACKUP_NAME"
    cp "$DB_FILE" "$BACKUP_NAME"
fi

# Remove existing database
if [ -f "$DB_FILE" ]; then
    echo "🗑️  Removing existing database..."
    rm -f "$DB_FILE"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

# Reset Prisma migrations for fresh setup
echo "🔄 Resetting Prisma migrations..."
rm -rf prisma/migrations

# Create database using Prisma migrations (proper method)
echo "🆕 Creating fresh database with Prisma migrations..."
npx prisma migrate dev --name init --create-only
npx prisma migrate deploy

# Generate Prisma client
echo "🛠️  Generating Prisma client..."
npx prisma generate

# Add sample data using Prisma
echo "📝 Adding sample data..."
sqlite3 "$DB_FILE" "
INSERT OR IGNORE INTO \"pastes\" (\"id\", \"title\", \"content\", \"language\", \"isPublic\") VALUES 
('demo_paste_001', 'Welcome to Advanced Pastebin', 'console.log(\"Hello, World! Welcome to Advanced Pastebin by Murr\");

// This is a demonstration paste
// Features:
// - Syntax highlighting
// - Line numbers (toggle with button)
// - Dark/Light themes
// - Search functionality
// - Admin panel
// - SQLite database with Prisma ORM

function welcomeMessage() {
    return \"Enjoy using Advanced Pastebin!\";
}

welcomeMessage();', 'javascript', true);
"

# Verify database creation
echo "✅ Database created successfully!"
echo ""
echo "📊 Database Statistics:"
echo "----------------------"
sqlite3 "$DB_FILE" "
SELECT 'Tables created: ' || COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations';
SELECT 'Indexes created: ' || COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';
SELECT 'Sample pastes: ' || COUNT(*) FROM pastes;
"

echo ""
echo "🚀 Database is ready for use!"
echo "   File: $DB_FILE"
echo "   Size: $(ls -lh $DB_FILE | awk '{print $5}')"
echo ""
echo "💡 Next steps:"
echo "   1. Start the application: npm run dev"
echo "   2. Visit: http://localhost:3000"
echo "   3. Access admin panel: http://localhost:3000/admin"
echo ""
echo "🔐 Don't forget to create an admin user via the application interface!"
echo "📝 Database and Prisma client are ready to use!"