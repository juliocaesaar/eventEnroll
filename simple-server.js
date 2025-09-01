import express from 'express';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = "postgresql://neondb_owner:npg_MWSB7L8Hvlab@ep-morning-bonus-acx66sds-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API endpoints
app.get('/api/test-db', async (req, res) => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      message: 'Database connection successful', 
      time: result.rows[0].current_time,
      status: 'ok'
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Database connection failed', 
      error: err.message,
      status: 'error'
    });
  } finally {
    await pool.end();
  }
});

app.get('/api/categories', async (req, res) => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const result = await pool.query('SELECT * FROM event_categories');
    res.json({ 
      categories: result.rows,
      count: result.rows.length,
      status: 'ok'
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch categories', 
      error: err.message,
      status: 'error'
    });
  } finally {
    await pool.end();
  }
});

app.get('/api/templates', async (req, res) => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const result = await pool.query('SELECT * FROM templates');
    res.json({ 
      templates: result.rows,
      count: result.rows.length,
      status: 'ok'
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch templates', 
      error: err.message,
      status: 'error'
    });
  } finally {
    await pool.end();
  }
});

app.get('/api/events', async (req, res) => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json({ 
      events: result.rows,
      count: result.rows.length,
      status: 'ok'
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch events', 
      error: err.message,
      status: 'error'
    });
  } finally {
    await pool.end();
  }
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.join(__dirname, 'client')
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Handle SPA routing - serve index.html for all routes
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      try {
        let template = await vite.transformIndexHtml(req.url, '');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API endpoints:`);
      console.log(`   - GET /api/test-db - Test database connection`);
      console.log(`   - GET /api/categories - Get event categories`);
      console.log(`   - GET /api/templates - Get templates`);
      console.log(`   - GET /api/events - Get events`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`📱 Access the frontend at: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
