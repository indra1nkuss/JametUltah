-- ============================================================
-- JAMET ULTAH - SUPABASE SETUP SCRIPT
-- Jalankan ini di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Tabel untuk menyimpan konten storybook (satu baris)
CREATE TABLE IF NOT EXISTS story_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert konten default (jika belum ada)
INSERT INTO story_content (content) 
SELECT '{
  "music": {
    "src": "",
    "title": "Jaz - Bersamamu"
  },
  "cover": {
    "badge": "✦ A JOURNEY OF LOVE ✦",
    "edition": "Special Birthday Edition",
    "tagline": "Selamat Ulang Tahun Untuk",
    "recipientName": "Sayangku Tercinta",
    "subtext": "\"Dari miliaran bintang di angkasa, hatiku selalu memilihmu.\"",
    "photo": ""
  },
  "spread1": {
    "prologueTitle": "Awal Dari Segalanya",
    "prologueP1": "Hari ini adalah perayaan atas kelahiran seseorang yang paling berharga di hidupku.",
    "prologueQuote": "\"Kamu bukan hanya sekadar seseorang yang kucintai, kamu adalah alasan mengapa aku percaya pada keajaiban takdir.\"",
    "prologueP2": "Buku ini adalah caraku mengabadikan senyummu, mengucap rasa syukur, dan mengirimkan doa tulus di hari spesialmu.",
    "chapter1Title": "Momen Hangat Bersamamu",
    "memory1Photo": "",
    "memory1Caption": "Tawa di Balik Secangkir Cokelat ☕",
    "memory1Date": "My Favorite Memory",
    "memory1Text": "Masih teringat bagaimana matamu berbinar saat kita tertawa bersama."
  },
  "spread2": {
    "chapter2Title": "Alasan Hatiku Memilihmu",
    "chapter2Sub": "Sentuh kartu di bawah ini untuk melihat apa yang kusukai darimu:",
    "reasons": [
      {"icon": "💖", "title": "Ketulusan Hatimu", "desc": "Caramu peduli pada hal-hal kecil membuat siapapun merasa begitu disayangi."},
      {"icon": "🌟", "title": "Senyuman Penenang", "desc": "Di hari paling lelah sekalipun, senyummu selalu menjadi obat terbaikku."},
      {"icon": "🕊️", "title": "Rumah Bagiku", "desc": "Bersamamu, aku bisa menjadi diriku apa adanya tanpa rasa takut."},
      {"icon": "🌷", "title": "Semangat Hebatmu", "desc": "Kerja keras dan kegigihanmu selalu membuatku bangga dan kagum padamu."}
    ],
    "chapter3Title": "Langkah Bersama Menuju Senja",
    "memory2Photo": "",
    "memory2Caption": "Langkah Cinta di Bawah Senja 🌾",
    "memory2Date": "Forever & Always",
    "memory2Text": "\"Aku ingin terus menggenggam tanganmu di setiap musim kehidupan.\""
  },
  "spread3": {
    "cakeTitle": "Buat Sebuah Permintaan ✨",
    "wishMessage": "\"Semoga setiap langkahmu diberkahi kemudahan, kesehatan, dan kebahagiaan tanpa akhir. Amin!\"",
    "letterTitle": "Sepucuk Surat Dari Hati",
    "letterDate": "27 Oktober 2026",
    "letterRecipient": "Sayangku",
    "letterContent": "Selamat ulang tahun yang terindah, sayangku. Terima kasih telah hadir dan menjadi bagian paling berharga dalam hidupku.",
    "letterSender": "Teman Hidupmu"
  },
  "spread4": {
    "giftTitle": "Kado Spesial Untukmu",
    "giftSecretMessage": "\"Kado terbesarku adalah waktu, kesetiaan, dan cintaku yang akan selalu ada untukmu selamanya.\"",
    "endingTitle": "Cinta yang Tak Pernah Usai",
    "endingQuote": "\"Aku mencintaimu bukan hanya untuk hari ini, melainkan untuk setiap hari esok yang belum kita jalani.\""
  }
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM story_content);

-- 3. Update timestamp otomatis
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_story_content_updated_at ON story_content;
CREATE TRIGGER trigger_story_content_updated_at
  BEFORE UPDATE ON story_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security — baca dan tulis dari backend
ALTER TABLE story_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read" ON story_content;
CREATE POLICY "Allow public read" ON story_content
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON story_content;
DROP POLICY IF EXISTS "Allow public insert" ON story_content;
CREATE POLICY "Allow public insert" ON story_content
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON story_content;
DROP POLICY IF EXISTS "Allow public update" ON story_content;
CREATE POLICY "Allow public update" ON story_content
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. STORAGE BUCKETS (photos & audio)
-- ============================================================

-- Bucket untuk foto (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos', 
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket untuk audio (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  52428800,  -- 50MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4']
) ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies untuk bucket photos
DROP POLICY IF EXISTS "Public read photos" ON storage.objects;
CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Auth upload photos" ON storage.objects;
CREATE POLICY "Auth upload photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Auth update photos" ON storage.objects;
CREATE POLICY "Auth update photos" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Auth delete photos" ON storage.objects;
CREATE POLICY "Auth delete photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'photos');

-- Storage policies untuk bucket audio
DROP POLICY IF EXISTS "Public read audio" ON storage.objects;
CREATE POLICY "Public read audio" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Auth upload audio" ON storage.objects;
CREATE POLICY "Auth upload audio" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio');

DROP POLICY IF EXISTS "Auth update audio" ON storage.objects;
CREATE POLICY "Auth update audio" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'audio');

DROP POLICY IF EXISTS "Auth delete audio" ON storage.objects;
CREATE POLICY "Auth delete audio" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'audio');
