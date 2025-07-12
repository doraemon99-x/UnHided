import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// Tambahkan CORS agar tidak diblokir browser
app.use(cors());

// Tambahkan header CORS manual (opsional, jika ingin eksplisit)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Ganti * dengan domain kamu jika perlu
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Proxy atau route kamu di sini...
// app.get(...) dst

// Jalankan server
const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
