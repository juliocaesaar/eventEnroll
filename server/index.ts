import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Definir variáveis de ambiente se não estiverem definidas
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_MWSB7L8Hvlab@ep-morning-bonus-acx66sds-pooler.sa-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "e1dad618b2990846d521f9261bbc3bef5b2dab3feb80b9133bd9b8304825e418";
}
if (!process.env.PUSHER_APP_ID) {
  process.env.PUSHER_APP_ID = "1820000";
}
if (!process.env.PUSHER_KEY) {
  process.env.PUSHER_KEY = "f0725138d607f195d650";
}
if (!process.env.PUSHER_SECRET) {
  process.env.PUSHER_SECRET = "e1dad618b2990846d521f9261bbc3bef5b2dab3feb80b9133bd9b8304825e418";
}
if (!process.env.PUSHER_CLUSTER) {
  process.env.PUSHER_CLUSTER = "sa1";
}
if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = "http://localhost:5000";
}
if (!process.env.RESEND_API_KEY) {
  process.env.RESEND_API_KEY = "re_L4nrK6rq_5oQT7qrdSsJaFgKWuD5oSFau";
}
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configurar webhook do Stripe ANTES de qualquer middleware de parsing
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('=== WEBHOOK ROUTE CHAMADA ===');
  console.log('Headers recebidos:', Object.keys(req.headers));
  console.log('Body recebido:', req.body ? 'SIM' : 'NÃO');
  console.log('Body type:', typeof req.body);
  console.log('Body length:', req.body?.length);
  console.log('Body is Buffer:', Buffer.isBuffer(req.body));
  
  try {
    const { StripeWebhookController } = await import("./controllers/stripeWebhookController");
    await StripeWebhookController.handleWebhook(req, res);
  } catch (error) {
    console.error('Erro no webhook do Stripe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middlewares de parsing para outras rotas
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
