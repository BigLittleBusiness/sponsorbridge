import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { ENV } from "./env";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { onboardingHeartbeatHandler } from "../scheduled/onboarding";
import { registerStripeRoutes } from "../stripe";
import { handleProjectStripeWebhook } from "../routers/projects";
import { customAuthRouter } from "../customAuth";
import { sponsorAuthRouter } from "../sponsorAuth";
import cookieParser from "cookie-parser";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "sponsorbridge" });
  });

  // Stripe webhook MUST be registered before express.json() so it receives raw body for signature verification
  registerStripeRoutes(app);

  // Project sponsorship Stripe webhook (raw body required for signature verification)
  app.post("/api/projects/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    try {
      const result = await handleProjectStripeWebhook(req.body as Buffer, sig);
      res.json(result);
    } catch (err: any) {
      console.error("[ProjectWebhook] Error:", err.message);
      res.status(400).json({ error: err.message });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  registerStorageProxy(app);
  if (ENV.oAuthServerUrl && ENV.appId) {
    registerOAuthRoutes(app);
  } else {
    console.info("[OAuth] Manus OAuth routes disabled: custom authentication remains available.");
  }

  // Custom auth routes (registration, OTP, login for charity admins)
  app.use("/api/auth", customAuthRouter);

  // Sponsor portal auth + data routes
  app.use("/api/sponsor", sponsorAuthRouter);

  // Scheduled heartbeat handlers — must be before Vite/static fallthrough
  app.post("/api/scheduled/onboarding", onboardingHeartbeatHandler);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
