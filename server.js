const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const CONTENT_FILE = path.join(__dirname, 'content.json');

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer Storage Configuration for Uploads
const storage = multer.diskStorage({
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
    // Keep custom target name if provided, or clean original name
    const targetName = req.query.targetName;
    if (targetName) {
      const ext = path.extname(file.originalname);
      cb(null, `${targetName}${ext}`);
    } else {
      const cleanName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, cleanName);
    }
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB max
});

// Serve static assets and web app
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Get Storybook Content
app.get('/api/content', (req, res) => {
  if (fs.existsSync(CONTENT_FILE)) {
    try {
      const content = fs.readFileSync(CONTENT_FILE, 'utf8');
      return res.json(JSON.parse(content));
    } catch (err) {
      return res.status(500).json({ error: 'Failed to read content file' });
    }
  }
  res.status(404).json({ error: 'Content not found' });
});

// 2. Save / Update Storybook Content
app.post('/api/content', (req, res) => {
  try {
    const updatedContent = req.body;
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(updatedContent, null, 2), 'utf8');
    res.json({ success: true, message: 'Konten berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menyimpan konten: ' + err.message });
  }
});

// 3. Upload Photo or Music File
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
  }

  const isAudio = req.file.mimetype.startsWith('audio/') || req.file.originalname.endsWith('.mp3');
  const relativePath = isAudio 
    ? `assets/music/${req.file.filename}` 
    : `assets/${req.file.filename}`;

  res.json({
    success: true,
    filePath: relativePath,
    fileName: req.file.filename,
    message: 'File berhasil diunggah!'
  });
});

// 4. List Music Files in assets/music
app.get('/api/music-list', (req, res) => {
  const musicDir = path.join(__dirname, 'assets', 'music');
  if (!fs.existsSync(musicDir)) {
    return res.json([]);
  }
  const files = fs.readdirSync(musicDir).filter(f => f.match(/\.(mp3|wav|ogg|m4a)$/i));
  const result = files.map(f => ({
    name: f,
    path: `assets/music/${f}`
  }));
  res.json(result);
});

// 5. Admin Dashboard Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✨ Birthday Storybook Server running at: http://localhost:${PORT}`);
  console.log(`🛠️  Backend CMS Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`=======================================================`);
});
