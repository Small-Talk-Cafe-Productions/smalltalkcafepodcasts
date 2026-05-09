import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Configure sizes and formats
const sizes = [320, 640, 1024, 1600];
const formats = ['webp', 'avif'];

const imagesDir = path.resolve(process.cwd(), 'public', 'images');
const outDir = path.resolve(imagesDir, 'optimized');

async function ensureOut() {
  try {
    await fs.mkdir(outDir, { recursive: true });
  } catch (err) {
    console.error('Could not create output dir', err);
    process.exit(1);
  }
}

async function listJpgs() {
  const files = await fs.readdir(imagesDir);
  return files.filter((f) => /\.(jpe?g|png)$/i.test(f));
}

function basenameWithoutExt(filename) {
  return filename.replace(/\.[^.]+$/, '');
}

async function processFile(file) {
  const input = path.join(imagesDir, file);
  const name = basenameWithoutExt(file);
  const img = sharp(input);
  const metadata = await img.metadata();
  for (const fmt of formats) {
    for (const w of sizes) {
      const outName = `${name}-${w}.${fmt}`;
      const outPath = path.join(outDir, outName);
      await img
        .resize({ width: Math.min(w, metadata.width || w) })
        [fmt]({ quality: 80 })
        .toFile(outPath);
      console.log('Written', outPath);
    }
  }
}

async function main() {
  await ensureOut();
  const files = await listJpgs();
  if (files.length === 0) {
    console.log('No local JPG/PNG images found in public/images');
    return;
  }
  for (const f of files) {
    await processFile(f);
  }
  console.log('All images processed.');
}

main().catch((err) => { console.error(err); process.exit(1); });
