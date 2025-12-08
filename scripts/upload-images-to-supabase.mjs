import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env at project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const bucketName = 'marosaimages';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or key. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const localImagesRoot = path.join(projectRoot, 'public', 'images');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

function walkDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

async function uploadFile(fullPath) {
  const relativeFromImages = path.relative(localImagesRoot, fullPath).replace(/\\/g, '/');
  // Storage path should be images/...
  const storagePath = `images/${relativeFromImages}`;

  const fileBuffer = fs.readFileSync(fullPath);
  const contentType = getContentType(fullPath);

  console.log(`Uploading ${fullPath} -> ${storagePath}`);

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      upsert: true,
      contentType,
    });

  if (error) {
    console.error(`Failed to upload ${storagePath}:`, error.message || error);
  }
}

async function main() {
  if (!fs.existsSync(localImagesRoot)) {
    console.error(`Local images folder not found: ${localImagesRoot}`);
    process.exit(1);
  }

  const files = walkDir(localImagesRoot);
  if (files.length === 0) {
    console.log('No files found in public/images');
    return;
  }

  console.log(`Found ${files.length} files. Starting upload to bucket "${bucketName}"...`);

  for (const file of files) {
    // Skip hidden files like .gitkeep
    if (path.basename(file).startsWith('.')) continue;
    await uploadFile(file);
  }

  console.log('Upload complete.');
}

main().catch((err) => {
  console.error('Unexpected error during upload:', err);
  process.exit(1);
});
