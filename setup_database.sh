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

# Create fresh database from schema
echo "🆕 Creating fresh database from schema.sql..."
sqlite3 "$DB_FILE" < schema.sql

# Verify database creation
echo "✅ Database created successfully!"
echo ""
echo "📊 Database Statistics:"
echo "----------------------"
sqlite3 "$DB_FILE" "
SELECT 'Tables created: ' || COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
SELECT 'Indexes created: ' || COUNT(*) FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';
SELECT 'Sample pastes: ' || COUNT(*) FROM pastes;
"

echo ""
echo "🚀 Database is ready for use!"
echo "   File: $DB_FILE"
echo "   Size: $(ls -lh $DB_FILE | awk '{print $5}')"
echo ""
echo "💡 Next steps:"
echo "   1. Update your .env file with DATABASE_URL=\"file:./$DB_FILE\""
echo "   2. Run: npm run db:generate"
echo "   3. Start the application: npm run dev"
echo ""
echo "🔐 Don't forget to create an admin user via the application interface!"