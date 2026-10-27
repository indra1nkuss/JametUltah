/**
 * server.js — Express server dengan integrasi Supabase
 * - Konten disimpan di Supabase (tabel story_content)
 * - File gambar & audio di-upload ke Supabase Storage
 * - Admin auth via Supabase Auth (email/password)
 * - Fallback ke content.json jika Supabase belum dikonfigurasi
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_FILE = path.join(__dirname, 'content.json');

// ==========================================
// SUPABASE CLIENT
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
const supabaseReady = !!(SUPABASE_URL && SUPABASE_ANON_KEY && 
  SUPABASE_URL !== 'https://XXXXXXXXXXXXXXXX.supabase.co');

if (supabaseReady) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase terhubung:', SUPABASE_URL);
} else {
  console.log('ℹ️  Mode Lokal: Supabase belum dikonfigurasi, menggunakan content.json');
}

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer untuk upload sementara (dipakai untuk upload ke Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(), // Simpan di memory, lalu upload ke Supabase
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Multer untuk upload lokal (fallback jika Supabase tidak tersedia)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = path.join(__dirname, 'assets');
    if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.mp3')) {
      uploadDir = path.join(__dirname, 'assets', 'music');
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, cleanName);
  }
});
const uploadLocal = multer({ storage: localStorage, limits: { fileSize: 50 * 1024 * 1024 } });

// Serve static assets dan web app
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// ==========================================
// HELPER: Auth middleware — verifikasi token JWT Supabase
// ==========================================
async function requireAuth(req, res, next) {
  // Jika Supabase belum dikonfigurasi, lewati auth (mode dev)
  if (!supabaseReady) {
    req.user = { email: 'dev@local', role: 'admin' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Tidak terautentikasi. Silakan login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah expired.' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Gagal memverifikasi token: ' + err.message });
  }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. LOGIN — Autentikasi admin dengan Supabase Auth
app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  const { email, password } = req.body;
  
  if (!supabaseReady) {
    // Mode dev: login langsung tanpa Supabase
    return res.json({ 
      success: true, 
      token: 'dev-token-local',
      user: { email: 'dev@local' },
      message: 'Login berhasil (mode lokal)'
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    
    res.json({
      success: true,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: { email: data.user.email, id: data.user.id },
      expiresAt: data.session.expires_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Login gagal: ' + err.message });
  }
});

// 2. LOGOUT
app.post(['/api/auth/logout', '/auth/logout'], requireAuth, async (req, res) => {
  if (!supabaseReady) return res.json({ success: true });
  
  try {
    await supabase.auth.signOut();
    res.json({ success: true, message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET CONTENT — Baca dari Supabase atau fallback ke content.json
app.get(['/api/content', '/content'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (!supabaseReady) {
    // Fallback: baca dari file lokal
    if (fs.existsSync(CONTENT_FILE)) {
      try {
        return res.json(JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')));
      } catch (err) {
        return res.status(500).json({ error: 'Gagal membaca content.json' });
      }
    }
    return res.status(404).json({ error: 'Konten tidak ditemukan' });
  }

  try {
    const { data, error } = await supabase
      .from('story_content')
      .select('content, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    res.json({ ...data.content, _updatedAt: data.updated_at });
  } catch (err) {
    // Fallback ke lokal jika DB error
    if (fs.existsSync(CONTENT_FILE)) {
      return res.json(JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8')));
    }
    res.status(500).json({ error: 'Gagal membaca konten: ' + err.message });
  }
});

// 4. UPDATE CONTENT — Simpan ke Supabase (butuh auth)
app.post(['/api/content', '/content'], requireAuth, async (req, res) => {
  const updatedContent = req.body;

  if (!supabaseReady) {
    // Fallback: simpan ke file lokal
    try {
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(updatedContent, null, 2), 'utf8');
      return res.json({ success: true, message: 'Konten berhasil disimpan (lokal)!' });
    } catch (err) {
      return res.status(500).json({ error: 'Gagal menyimpan: ' + err.message });
    }
  }

  try {
    // Gunakan user client dengan token jika tersedia agar lolos aturan RLS authenticated
    const clientToUse = (req.token && req.token !== 'dev-token-local')
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${req.token}` } }
        })
      : supabase;

    // Cek apakah sudah ada baris
    const { data: existing } = await clientToUse
      .from('story_content')
      .select('id')
      .limit(1)
      .single();

    let result;
    const nowIso = new Date().toISOString();

    if (existing) {
      // Update baris yang sudah ada
      result = await clientToUse
        .from('story_content')
        .update({ content: updatedContent, updated_at: nowIso })
        .eq('id', existing.id)
        .select();
    } else {
      // Insert baris baru
      result = await clientToUse
        .from('story_content')
        .insert({ content: updatedContent, updated_at: nowIso })
        .select();
    }

    if (result.error) throw result.error;

    // Validasi apakah data benar-benar tersimpan (tidak diblokir oleh RLS Supabase)
    if (!result.data || result.data.length === 0) {
      // Coba fallback dengan client global
      const fallbackResult = await supabase
        .from('story_content')
        .update({ content: updatedContent, updated_at: nowIso })
        .eq('id', existing.id)
        .select();

      if (!fallbackResult.data || fallbackResult.data.length === 0) {
        throw new Error('Supabase RLS menolak update database (0 baris diubah). Harap jalankan script SQL izin update di Supabase SQL Editor.');
      }
    }

    // Juga update content.json lokal sebagai backup
    try {
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(updatedContent, null, 2), 'utf8');
    } catch (e) {}

    res.json({ success: true, message: '✅ Konten berhasil disimpan ke Supabase!' });
  } catch (err) {
    console.error('Error saving content:', err);
    res.status(500).json({ error: 'Gagal menyimpan konten: ' + err.message });
  }
});

// 5. UPLOAD FILE — Upload ke Supabase Storage atau lokal (butuh auth)
app.post(['/api/upload', '/upload'], requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
  }

  const isAudio = req.file.mimetype.startsWith('audio/') || req.file.originalname.match(/\.(mp3|wav|ogg|m4a)$/i);
  const bucket = isAudio ? 'audio' : 'photos';
  const timestamp = Date.now();
  const cleanName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${timestamp}-${cleanName}`;

  if (!supabaseReady) {
    // Fallback: simpan lokal
    const localUpload = uploadLocal.single('file');
    const uploadDir = isAudio ? path.join(__dirname, 'assets', 'music') : path.join(__dirname, 'assets');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);
    const relativePath = isAudio ? `assets/music/${fileName}` : `assets/${fileName}`;
    
    return res.json({
      success: true,
      filePath: relativePath,
      publicUrl: `/${relativePath}`,
      fileName,
      message: 'File berhasil diunggah (lokal)!'
    });
  }

  try {
    // Upload ke Supabase Storage menggunakan user token
    const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${req.token}` } }
    });

    const { data, error } = await userSupabase.storage
      .from(bucket)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // Dapatkan public URL
    const { data: urlData } = userSupabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    res.json({
      success: true,
      filePath: urlData.publicUrl,
      publicUrl: urlData.publicUrl,
      fileName,
      bucket,
      message: '✅ File berhasil diunggah ke Supabase Storage!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengunggah file: ' + err.message });
  }
});

// 6. LIST AUDIO dari Supabase Storage
app.get(['/api/music-list', '/music-list'], async (req, res) => {
  if (!supabaseReady) {
    // Fallback: scan folder lokal
    const musicDir = path.join(__dirname, 'assets', 'music');
    if (!fs.existsSync(musicDir)) return res.json([]);
    const files = fs.readdirSync(musicDir).filter(f => f.match(/\.(mp3|wav|ogg|m4a)$/i));
    return res.json(files.map(f => ({ name: f, path: `assets/music/${f}`, publicUrl: `/assets/music/${f}` })));
  }

  try {
    const { data, error } = await supabase.storage.from('audio').list('', { limit: 100 });
    if (error) throw error;

    const result = data
      .filter(f => f.name.match(/\.(mp3|wav|ogg|m4a)$/i))
      .map(f => {
        const { data: urlData } = supabase.storage.from('audio').getPublicUrl(f.name);
        return { name: f.name, path: f.name, publicUrl: urlData.publicUrl };
      });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. STATUS API — Cek apakah Supabase terhubung
app.get(['/api/status', '/status'], (req, res) => {
  res.json({
    supabase: supabaseReady,
    mode: supabaseReady ? 'supabase' : 'local',
    url: supabaseReady ? SUPABASE_URL : null
  });
});

// 8. Halaman Utama Pengunjung
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 9. Admin Dashboard Route
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start Server (only listen if run directly, not in Vercel serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('=======================================================');
    console.log(`✨ Birthday Storybook Server: http://localhost:${PORT}`);
    console.log(`🛠️  Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`📦 Mode: ${supabaseReady ? 'Supabase Cloud' : 'Lokal (content.json)'}`);
    console.log('=======================================================');
  });
}

module.exports = app;
