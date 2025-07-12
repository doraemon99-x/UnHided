import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// Global CORS middleware dan preflight support
app.use(cors());
app.options('*', cors());

// Middleware tambahan untuk header CORS manual (opsional)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Ganti '*' dengan domain spesifik jika perlu
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api_password');
  next();
});

// Proxy endpoint untuk manifest.m3u8
app.get('/proxy/hls/manifest.m3u8', async (req, res) => {
  const url = req.query.d;
  const password = req.query.api_password || req.headers['api_password'];

  if (password !== 'test') {
    return res.status(403).json({ error: 'Invalid API password' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.statusText}`);
    }

    let body = await response.text();

    // Rewrite URL segmen .ts yang absolut agar melalui proxy
    body = body.replace(/^(?!#)(https?:\/\/.*?\.ts)/gm, (match) => {
      return `/proxy/hls/segment.ts?d=${encodeURIComponent(match)}&api_password=test`;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch or parse the M3U8 file.' });
  }
});

// Proxy endpoint untuk segmen .ts
app.get('/proxy/hls/segment.ts', async (req, res) => {
  const url = req.query.d;
  const password = req.query.api_password || req.headers['api_password'];

  if (password !== 'test') {
    return res.status(403).json({ error: 'Invalid API password' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (!response.ok) {
      throw new Error(`Segment upstream error: ${response.statusText}`);
    }

    res.setHeader('Content-Type', response.headers.get('content-type') || 'video/MP2T');
    res.setHeader('Access-Control-Allow-Origin', '*');
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch TS segment.' });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
