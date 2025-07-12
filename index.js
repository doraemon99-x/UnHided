import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// ✅ Global CORS middleware
app.use(cors());
app.options('*', cors()); // preflight support

// ✅ Middleware manual untuk memastikan CORS header selalu diset
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // ubah jika perlu
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, api_password');
  next();
});

// ✅ /proxy/hls/manifest.m3u8
app.get('/proxy/hls/manifest.m3u8', async (req, res) => {
  const url = req.query.d;
  const password = req.query.api_password || req.headers['api_password'];

  if (password !== 'test') {
    return res.status(403).json({ error: 'Invalid API password' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream error: ${response.statusText}`);
    }

    let body = await response.text();

    // Rewrite .ts or segment URLs to go through our proxy
    body = body.replace(/^(?!#)(.*\.ts)/gm, (match) => {
      const segmentUrl = new URL(match, url).href;
      return `/proxy/hls/segment.ts?d=${encodeURIComponent(segmentUrl)}&api_password=test`;
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch or parse the M3U8 file.' });
  }
});

// ✅ /proxy/hls/segment.ts
app.get('/proxy/hls/segment.ts', async (req, res) => {
  const url = req.query.d;
  const password = req.query.api_password || req.headers['api_password'];

  if (password !== 'test') {
    return res.status(403).json({ error: 'Invalid API password' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
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
