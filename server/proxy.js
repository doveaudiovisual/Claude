/**
 * server/proxy.js
 * Express reverse-proxy for production deployment.
 * Injects the Windy key server-side so it never appears in client bundles.
 *
 * Routes:
 *   /api/windy/*     → https://api.windy.com/*  (key injected via header)
 *   /api/overpass/*  → https://overpass-api.de/*
 *   /api/keeptrack/* → https://celestrak.org/*
 *   /api/nominatim/* → https://nominatim.openstreetmap.org/*
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 3001;
const WINDY_KEY = process.env.WINDY_KEY ?? '';

// ── Windy webcam API proxy ─────────────────────────────────────────────────
app.use(
  '/api/windy',
  createProxyMiddleware({
    target: 'https://api.windy.com',
    changeOrigin: true,
    pathRewrite: { '^/api/windy': '' },
    on: {
      proxyReq: (proxyReq) => {
        // Inject Windy key into every outbound request
        proxyReq.setHeader('x-windy-api-key', WINDY_KEY);
      },
    },
  })
);

// ── Overpass API proxy ──────────────────────────────────────────────────────
app.use(
  '/api/overpass',
  createProxyMiddleware({
    target: 'https://overpass-api.de',
    changeOrigin: true,
    pathRewrite: { '^/api/overpass': '' },
  })
);

// ── CelesTrak TLE proxy ─────────────────────────────────────────────────────
app.use(
  '/api/keeptrack',
  createProxyMiddleware({
    target: 'https://celestrak.org',
    changeOrigin: true,
    pathRewrite: { '^/api/keeptrack': '' },
  })
);

// ── Nominatim geocoding proxy ───────────────────────────────────────────────
app.use(
  '/api/nominatim',
  createProxyMiddleware({
    target: 'https://nominatim.openstreetmap.org',
    changeOrigin: true,
    pathRewrite: { '^/api/nominatim': '' },
    on: {
      proxyReq: (proxyReq) => {
        // Nominatim requires a valid User-Agent
        proxyReq.setHeader('User-Agent', 'GodsEyeApp/1.0 (contact@example.com)');
      },
    },
  })
);

// ── Serve built frontend in production ─────────────────────────────────────
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[proxy] listening on http://localhost:${PORT}`);
  if (!WINDY_KEY) {
    console.warn('[proxy] WARNING: WINDY_KEY is not set — webcam API calls will fail');
  }
});
