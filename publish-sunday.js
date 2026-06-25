#!/usr/bin/env node
/**
 * publish-sunday.js
 * 
 * Quick script to publish a Sunday worship page after service.
 * Adds YouTube video ID and optional clip ID, marks as published,
 * then regenerates all pages.
 * 
 * Usage:
 *   node publish-sunday.js --week 2 --video dQw4w9WgXcQ
 *   node publish-sunday.js --week 2 --video dQw4w9WgXcQ --clip abc123XYZ
 *   node publish-sunday.js --week 2 --unpublish
 * 
 * After running, commit and push to deploy:
 *   git add sundays/ sundays-data.json && git commit -m "Publish Week 2" && git push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, 'sundays-data.json');

// ─── Parse args ───────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const weekNum = parseInt(getArg('week'));
const videoId = getArg('video');
const clipId = getArg('clip');
const unpublish = args.includes('--unpublish');

if (!weekNum) {
  console.log(`
🌊 publish-sunday.js — Publish a Sunday worship page

Usage:
  node publish-sunday.js --week 2 --video YOUTUBE_VIDEO_ID
  node publish-sunday.js --week 2 --video YOUTUBE_VIDEO_ID --clip CLIP_ID
  node publish-sunday.js --week 2 --unpublish

Options:
  --week N       Week number (required)
  --video ID     YouTube video ID for the full service
  --clip ID      YouTube video ID for the short clip (from Pastors.ai)
  --unpublish    Mark as unpublished

After running:
  git add sundays/ sundays-data.json
  git commit -m "Publish Week N"
  git push
  `);
  
  // Show current status
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log('Current status:');
    data.sundays.forEach(s => {
      const pub = s.isPublished ? '✅' : '⏳';
      const vid = s.video.serviceId ? '🎬' : '  ';
      const clip = s.video.clipId ? '📎' : '  ';
      console.log(`  ${pub} ${vid} ${clip} Week ${String(s.weekNumber).padStart(2)} · ${s.title}`);
    });
  }
  process.exit(0);
}

// ─── Load and update ──────────────────────────────────────
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const sunday = data.sundays.find(s => s.weekNumber === weekNum);

if (!sunday) {
  console.error(`❌ Week ${weekNum} not found in data file.`);
  process.exit(1);
}

console.log(`\n🌊 Updating Week ${weekNum}: "${sunday.title}"`);

if (unpublish) {
  sunday.isPublished = false;
  console.log(`  ⏳ Marked as unpublished`);
} else {
  if (videoId) {
    sunday.video.serviceId = videoId;
    console.log(`  🎬 YouTube video: ${videoId}`);
  }
  if (clipId) {
    sunday.video.clipId = clipId;
    console.log(`  📎 Clip video: ${clipId}`);
  }
  sunday.isPublished = true;
  console.log(`  ✅ Marked as published`);
}

// ─── Save ─────────────────────────────────────────────────
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
console.log(`  💾 Data file updated`);

// ─── Regenerate ───────────────────────────────────────────
console.log(`\n  Regenerating pages...`);
try {
  execSync(`node ${path.join(__dirname, 'generate-sundays.js')}`, { stdio: 'inherit' });
} catch (e) {
  console.error('❌ Generation failed:', e.message);
  process.exit(1);
}

console.log(`\n✅ Done! Now commit and push:`);
console.log(`   git add sundays/ sundays-data.json`);
console.log(`   git commit -m "Publish Week ${weekNum}: ${sunday.title}"`);
console.log(`   git push\n`);
