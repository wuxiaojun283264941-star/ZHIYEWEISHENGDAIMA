import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDB } from './db/init.js';

// Route modules
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import employeeRoutes from './routes/employee.js';
import positionRoutes from './routes/position.js';
import hazardFactorRoutes from './routes/hazardFactor.js';
import factoryContactRoutes from './routes/factoryContact.js';
import healthAgentRoutes from './routes/healthAgent.js';
import examTaskRoutes from './routes/examTask.js';
import examReportRoutes from './routes/examReport.js';
import examPackageRoutes from './routes/examPackage.js';
import dashboardRoutes from './routes/dashboard.js';
import cUnitRoutes from './routes/cUnit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(multipart, {
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520') }
});

// Serve uploaded files statically
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads/reports');
// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
await app.register(staticPlugin, {
  root: uploadsDir,
  prefix: '/uploads/reports/',
  decorateReply: false
});

// Serve frontend static files in production
const publicDir = path.join(__dirname, 'public');
try {
  if (fs.existsSync(publicDir)) {
    await app.register(staticPlugin, {
      root: publicDir,
      prefix: '/',
      decorateReply: false
    });
    // SPA fallback: return index.html for non-API/non-upload routes
    app.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api') && !request.url.startsWith('/uploads')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ code: -1, data: null, message: 'Not Found' });
    });
    console.log('Serving frontend static files from:', publicDir);
  }
} catch (e) {
  // public directory does not exist, skip serving frontend
}

// Initialize database
initDB();

// Auto-seed on first run (if no admin user exists)
import { getDB } from './db/init.js';
const db = getDB();
const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('admin');
if (adminCount.cnt === 0) {
  console.log('No admin user found, running seed...');
  const { execSync } = await import('child_process');
  const __filename2 = fileURLToPath(import.meta.url);
  const __dirname2 = path.dirname(__filename2);
  try {
    execSync(`node "${path.join(__dirname2, 'db', 'seed.js')}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Seed failed (non-fatal):', e.message);
  }
}

// ============================================================
// Register all route modules
// ============================================================
app.register(authRoutes, { prefix: '/api/auth' });
app.register(adminRoutes, { prefix: '/api/admin' });
app.register(employeeRoutes, { prefix: '/api/employees' });
app.register(positionRoutes, { prefix: '/api/positions' });
app.register(hazardFactorRoutes, { prefix: '/api/hazard-factors' });
app.register(factoryContactRoutes, { prefix: '/api/factory-contacts' });
app.register(healthAgentRoutes, { prefix: '/api/health-agents' });
app.register(examTaskRoutes, { prefix: '/api/exam-tasks' });
app.register(examReportRoutes, { prefix: '/api/exam-reports' });
app.register(examPackageRoutes, { prefix: '/api/exam-packages' });
app.register(dashboardRoutes, { prefix: '/api/dashboard' });
app.register(cUnitRoutes, { prefix: '/api/cunit' });

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = parseInt(process.env.PORT || '3001');
const HOST = '0.0.0.0';

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`Server running on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
