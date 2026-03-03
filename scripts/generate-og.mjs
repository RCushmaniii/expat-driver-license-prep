/**
 * Generate OG image (1200x630) for social sharing.
 * Run: node scripts/generate-og.mjs
 */
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../public/og-image.png");

// Navy brand color
const navy = "#0F2A44";
const navyLight = "#1E4E79";
const white = "#FFFFFF";

// Build SVG for the OG image — all content centered in safe zone
const svgImage = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${navy}"/>
      <stop offset="100%" stop-color="#071620"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle road lines pattern -->
  <line x1="540" y1="630" x2="580" y2="400" stroke="${navyLight}" stroke-width="1.5" opacity="0.15"/>
  <line x1="660" y1="630" x2="620" y2="400" stroke="${navyLight}" stroke-width="1.5" opacity="0.15"/>
  <!-- Center dashes -->
  <line x1="600" y1="630" x2="600" y2="600" stroke="${navyLight}" stroke-width="1" opacity="0.1"/>
  <line x1="600" y1="580" x2="600" y2="555" stroke="${navyLight}" stroke-width="1" opacity="0.1"/>
  <line x1="600" y1="535" x2="600" y2="515" stroke="${navyLight}" stroke-width="0.8" opacity="0.08"/>

  <!-- Steering wheel icon (centered, upper area) -->
  <g transform="translate(600, 220)">
    <!-- Outer ring -->
    <circle cx="0" cy="0" r="65" fill="none" stroke="${white}" stroke-width="6" opacity="0.95"/>
    <!-- Center hub -->
    <circle cx="0" cy="0" r="16" fill="${white}" opacity="0.95"/>
    <!-- Spokes -->
    <line x1="0" y1="-16" x2="0" y2="-65" stroke="${white}" stroke-width="5" stroke-linecap="round" opacity="0.95"/>
    <line x1="-14" y1="8" x2="-56" y2="34" stroke="${white}" stroke-width="5" stroke-linecap="round" opacity="0.95"/>
    <line x1="14" y1="8" x2="56" y2="34" stroke="${white}" stroke-width="5" stroke-linecap="round" opacity="0.95"/>
  </g>

  <!-- Brand name -->
  <text x="600" y="370" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="64" font-weight="700" fill="${white}" letter-spacing="-1">ExpatDrive</text>

  <!-- Tagline -->
  <text x="600" y="420" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="400" fill="${white}" opacity="0.7">Study smart. Drive legal.</text>

  <!-- Subtle bottom bar -->
  <rect x="0" y="610" width="1200" height="20" fill="${navyLight}" opacity="0.3"/>
  <text x="600" y="624" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" fill="${white}" opacity="0.5">expat-driver-license-prep.vercel.app</text>
</svg>
`;

const buffer = await sharp(Buffer.from(svgImage)).png().toBuffer();
writeFileSync(outputPath, buffer);
console.log(`OG image generated: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
