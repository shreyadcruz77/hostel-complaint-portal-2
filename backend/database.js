const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

// Initialize SQLite database file
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// 3 Database Entities / Models:
// 1. User: Stores registered hostel residents
// 2. Category: Stores complaint categories (Electrical, Plumbing, Wi-Fi, etc.)
// 3. Complaint: Stores filed complaints with status tracking
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    room_number TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial hostel complaint categories if empty
const countRow = db.prepare('SELECT count(*) as count FROM categories').get();
if (!countRow || countRow.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)');
  insertCategory.run('cat_1', 'Electrical', '⚡');
  insertCategory.run('cat_2', 'Plumbing & Water', '🚰');
  insertCategory.run('cat_3', 'Wi-Fi & Internet', '📶');
  insertCategory.run('cat_4', 'Furniture & Carpentry', '🪑');
  insertCategory.run('cat_5', 'Housekeeping & Cleanliness', '🧹');
}

module.exports = db;
