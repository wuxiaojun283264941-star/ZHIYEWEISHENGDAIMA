import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'data', 'occupational_health.db');

let db = null;

/** Get the singleton database instance */
export function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/** Initialize database schema */
export function initDB() {
  const database = getDB();

  database.exec(`
    CREATE TABLE IF NOT EXISTS factories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      industry_type TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS factory_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      position TEXT DEFAULT '',
      phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER DEFAULT 0,
      work_years INTEGER DEFAULT 0,
      position TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      id_card TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS health_agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT DEFAULT '',
      center_name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factory_id INTEGER NOT NULL,
      health_agent_id INTEGER NOT NULL,
      factory_contact_id INTEGER DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'pushed' CHECK(status IN ('pushed', 'in_progress', 'completed')),
      pushed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (factory_id) REFERENCES factories(id),
      FOREIGN KEY (health_agent_id) REFERENCES health_agents(id),
      FOREIGN KEY (factory_contact_id) REFERENCES factory_contacts(id)
    );

    CREATE TABLE IF NOT EXISTS exam_task_employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_task_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      exam_status TEXT NOT NULL DEFAULT 'pending' CHECK(exam_status IN ('pending', 'examined')),
      FOREIGN KEY (exam_task_id) REFERENCES exam_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_task_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exam_task_id) REFERENCES exam_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS c_unit_agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sms_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expire_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized successfully');
  return database;
}

export default { getDB, initDB };
