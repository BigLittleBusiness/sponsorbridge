/**
 * Vite dev-server integration (development only) and static file serving (production).
 *
 * All vite-related imports are done via runtime-computed paths so esbuild
 * cannot statically resolve them and will NOT bundle vite or vite.config.
 */
import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

// ─── Development: Vite middleware ────────────────────────────────────────────

export async function setupVite(app: Express, server: Server) {
  // Build the config path at runtime so esbuild cannot follow it at bundle time.
  const configPath = path.resolve(import.meta.dirname, "..", "..", "vite.config");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { createServer: createViteServer } = await import("vite") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viteConfig = (await import(/* @vite-ignore */ configPath)).default;
  const { nanoid } = await import("nanoid");

  const dev = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: { middlewareMode: true, hmr: { server }, allowedHosts: true as const },
    appType: "custom",
  });

  app.use(dev.middlewares);
  app.use("*", async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await dev.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      dev.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// ─── Production: serve pre-built static files ────────────────────────────────

export function serveStatic(app: Express) {
  // esbuild outputs the server bundle to dist/index.js.
  // Vite outputs the client build to dist/public/.
  // import.meta.dirname resolves to the directory of dist/index.js → dist/
  // so path.resolve(import.meta.dirname, "public") → dist/public ✓
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `[serveStatic] Build directory not found: ${distPath}. Run "pnpm build" first.`
    );
  }

  app.use(express.static(distPath));

  // SPA fallback — all unmatched routes serve index.html
  app.use("*", (_req: express.Request, res: express.Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
