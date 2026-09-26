#!/usr/bin/env node

/**
 * DaneshMate Mobile Automated Visual Asset Generator
 * 
 * Takes a master brand image (logo-source.png/jpg/svg) and generates:
 * 1. icon.png (1024x1024 - Full Bleed Square for iOS / Store)
 * 2. adaptive-icon.png (1024x1024 - 66% Safe Zone, Transparent Canvas for Android)
 * 3. splash.png (1242x2436 - Centered Emblem on #090D16 Background)
 * 4. favicon.png (48x48 - Crisp Geometric Web Icon)
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname, '../assets');
const BACKGROUND_COLOR = { r: 9, g: 13, b: 22, alpha: 1 }; // #090D16
const TRANSPARENT_COLOR = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  console.log('====================================================');
  console.log('  DaneshMate Automated Visual Asset Generator       ');
  console.log('====================================================');

  let sharp;
  try {
    sharp = require('sharp');
  } catch (err) {
    console.error('[-] Error: "sharp" package is required to generate assets.');
    console.error('    Please install it via: npm install --save-dev sharp');
    process.exit(1);
  }

  // Ensure assets directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Check for source file in order of preference / most recently modified
  const potentialSources = [
    'logo-source.png',
    'logo-source.jpg',
    'logo-source.jpeg',
    'logo-source.svg',
    'logo-source.webp',
  ];

  let sourcePath = null;
  let latestMtime = 0;
  for (const filename of potentialSources) {
    const candidate = path.join(ASSETS_DIR, filename);
    if (fs.existsSync(candidate)) {
      const stat = fs.statSync(candidate);
      if (stat.size > 0 && stat.mtimeMs > latestMtime) {
        latestMtime = stat.mtimeMs;
        sourcePath = candidate;
      }
    }
  }

  let sourceBuffer;
  if (sourcePath) {
    console.log(`[✓] Found source asset: ${path.basename(sourcePath)}`);
    sourceBuffer = fs.readFileSync(sourcePath);
  } else {
    console.log('[!] No "logo-source.png" found. Generating high-resolution DaneshMate vector master...');
    // Create an elegant SVG master emblem (Cyber-Luxe Glass Graduation Cap + "DM" Monogram)
    const masterSvg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366F1" />
            <stop offset="100%" stop-color="#3B82F6" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10B981" />
            <stop offset="100%" stop-color="#06B6D4" />
          </linearGradient>
          <filter id="luminousGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="32" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Base Background -->
        <rect width="1024" height="1024" rx="224" fill="url(#bgGrad)" />
        <rect width="1024" height="1024" rx="224" fill="none" stroke="#334155" stroke-width="4" opacity="0.6" />

        <!-- Ambient Glow -->
        <circle cx="512" cy="512" r="320" fill="url(#accentGrad)" opacity="0.22" filter="url(#luminousGlow)" />

        <!-- Academic Cap & Geometric Modern Emblem -->
        <g transform="translate(192, 192) scale(0.625)">
          <!-- Graduation Cap Top Rhombus -->
          <polygon points="512,140 880,320 512,500 144,320" fill="url(#accentGrad)" />
          
          <!-- Cap Base Underlay -->
          <path d="M 280,410 L 280,620 C 280,740 744,740 744,620 L 744,410 L 512,520 Z" fill="#1E293B" stroke="url(#glowGrad)" stroke-width="14" />
          
          <!-- Golden / Neon Tassel -->
          <path d="M 880,320 L 890,560 C 890,600 860,630 830,650" fill="none" stroke="#F59E0B" stroke-width="18" stroke-linecap="round" />
          <circle cx="830" cy="670" r="28" fill="#F59E0B" />

          <!-- Sparkle Star Accent -->
          <path d="M 512,740 Q 512,840 412,840 Q 512,840 512,940 Q 512,840 612,840 Q 512,840 512,740 Z" fill="url(#glowGrad)" />
        </g>

        <!-- DaneshMate Typography Monogram Accent -->
        <text x="512" y="870" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="76" fill="#F8FAFC" text-anchor="middle" letter-spacing="4">
          DANESHMATE
        </text>
      </svg>
    `;

    const placeholderSourcePath = path.join(ASSETS_DIR, 'logo-source.png');
    fs.writeFileSync(placeholderSourcePath, await sharp(Buffer.from(masterSvg)).png().toBuffer());
    console.log(`[✓] Seeded default master asset: ${path.basename(placeholderSourcePath)}`);
    sourceBuffer = fs.readFileSync(placeholderSourcePath);
  }

  // 1. Generate icon.png (1024x1024 full bleed)
  const iconPath = path.join(ASSETS_DIR, 'icon.png');
  await sharp(sourceBuffer)
    .resize(1024, 1024, { fit: 'cover', position: 'center' })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(iconPath);
  console.log(`[✓] Generated: icon.png (1024x1024)`);

  // 2. Generate adaptive-icon.png (1024x1024 canvas with 66% safe zone = ~676px emblem on transparent)
  const adaptiveEmblemSize = 676;
  const adaptiveEmblem = await sharp(sourceBuffer)
    .resize(adaptiveEmblemSize, adaptiveEmblemSize, { fit: 'contain', background: TRANSPARENT_COLOR })
    .png()
    .toBuffer();

  const adaptiveIconPath = path.join(ASSETS_DIR, 'adaptive-icon.png');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: TRANSPARENT_COLOR,
    },
  })
    .composite([
      {
        input: adaptiveEmblem,
        gravity: 'center',
      },
    ])
    .png({ quality: 100 })
    .toFile(adaptiveIconPath);
  console.log(`[✓] Generated: adaptive-icon.png (1024x1024 with 66% safe zone)`);

  // 3. Generate splash.png (1242x2436 canvas centered on #090D16 background)
  const splashLogoWidth = 560;
  const splashLogo = await sharp(sourceBuffer)
    .resize(splashLogoWidth, splashLogoWidth, { fit: 'contain', background: TRANSPARENT_COLOR })
    .png()
    .toBuffer();

  const splashPath = path.join(ASSETS_DIR, 'splash.png');
  await sharp({
    create: {
      width: 1242,
      height: 2436,
      channels: 4,
      background: BACKGROUND_COLOR,
    },
  })
    .composite([
      {
        input: splashLogo,
        gravity: 'center',
      },
    ])
    .png({ quality: 100 })
    .toFile(splashPath);
  console.log(`[✓] Generated: splash.png (1242x2436 centered on #090D16)`);

  // 4. Generate favicon.png (48x48 crisp square)
  const faviconPath = path.join(ASSETS_DIR, 'favicon.png');
  await sharp(sourceBuffer)
    .resize(48, 48, { fit: 'contain', background: TRANSPARENT_COLOR })
    .png({ quality: 95 })
    .toFile(faviconPath);
  console.log(`[✓] Generated: favicon.png (48x48)`);

  console.log('\n[✓] All mobile visual assets generated successfully!\n');
}

main().catch((err) => {
  console.error('[-] Asset generation failed:', err);
  process.exit(1);
});
