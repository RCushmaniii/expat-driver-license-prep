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
  <line x1="480" y1="630" x2="550" y2="340" stroke="${navyLight}" stroke-width="2" opacity="0.12"/>
  <line x1="720" y1="630" x2="650" y2="340" stroke="${navyLight}" stroke-width="2" opacity="0.12"/>
  <!-- Center dashes -->
  <line x1="600" y1="630" x2="600" y2="590" stroke="${navyLight}" stroke-width="1.5" opacity="0.08"/>
  <line x1="600" y1="565" x2="600" y2="530" stroke="${navyLight}" stroke-width="1.5" opacity="0.08"/>
  <line x1="600" y1="505" x2="600" y2="475" stroke="${navyLight}" stroke-width="1" opacity="0.06"/>

  <!-- Steering wheel icon (centered, upper area) -->
  <g transform="translate(600, 195)">
    <!-- Outer ring -->
    <circle cx="0" cy="0" r="105" fill="none" stroke="${white}" stroke-width="9" opacity="0.95"/>
    <!-- Center hub -->
    <circle cx="0" cy="0" r="26" fill="${white}" opacity="0.95"/>
    <!-- Spokes -->
    <line x1="0" y1="-26" x2="0" y2="-105" stroke="${white}" stroke-width="8" stroke-linecap="round" opacity="0.95"/>
    <line x1="-22" y1="13" x2="-91" y2="55" stroke="${white}" stroke-width="8" stroke-linecap="round" opacity="0.95"/>
    <line x1="22" y1="13" x2="91" y2="55" stroke="${white}" stroke-width="8" stroke-linecap="round" opacity="0.95"/>
  </g>

  <!-- Brand name -->
  <text x="600" y="400" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="96" font-weight="700" fill="${white}" letter-spacing="-2">ExpatDrive</text>

  <!-- Tagline -->
  <text x="600" y="470" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="400" fill="${white}" opacity="0.75">Study smart. Drive legal.</text>

  <!-- Domain -->
  <text x="600" y="560" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="500" fill="${white}" opacity="0.4">getexpatdrive.com</text>
</svg>
`;

const buffer = await sharp(Buffer.from(svgImage)).png().toBuffer();
writeFileSync(outputPath, buffer);
console.log(`OG image generated: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
