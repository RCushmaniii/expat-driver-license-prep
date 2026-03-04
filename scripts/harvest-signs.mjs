#!/usr/bin/env node

/**
 * Mexican Road Sign SVG Harvester
 *
 * Downloads official road sign SVGs from Wikimedia Commons using their API.
 * Targets SP (preventivas/warning) and SR (restrictivas/regulatory) categories.
 *
 * Usage:
 *   node scripts/harvest-signs.mjs              # Normal run (skip existing)
 *   node scripts/harvest-signs.mjs --dry-run    # List signs without downloading
 *   node scripts/harvest-signs.mjs --force      # Re-download all files
 *
 * Output:
 *   public/signs/{CODE}.svg                     # Downloaded SVGs
 *   public/data/jalisco/harvested-signs.json    # Structural metadata (pipeline output)
 *   content/.../signs-content.json              # Content stubs (editable, never overwritten)
 */

import { writeFile, mkdir, readFile, access, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Configuration ─────────────────────────────────────────────────────────────

const SIGNS_DIR = join(ROOT, "public", "signs");
const METADATA_OUT = join(ROOT, "public", "data", "jalisco", "harvested-signs.json");
const CONTENT_STUBS_OUT = join(
  ROOT,
  "content",
  "countries",
  "mexico",
  "jalisco",
  "signs-content.json"
);

const USER_AGENT =
  "ExpatDriveSignHarvester/1.0 (https://getexpatdrive.com; robert@cushlabs.com)";
const RATE_LIMIT_MS = 1200; // >1s between requests — Wikimedia asks for polite rate limiting
const MAX_SVG_SIZE = 100 * 1024; // 100KB sanity limit
const API_BASE = "https://commons.wikimedia.org/w/api.php";

// Wikimedia Commons categories to crawl (SP = warning, SR = regulatory)
const CATEGORIES = [
  "Category:SVG_warning_road_signs_of_Mexico",
  "Category:SVG_regulatory_road_signs_of_Mexico",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.size > 0;
  } catch {
    return false;
  }
}

// ─── Wikimedia Commons API ─────────────────────────────────────────────────────

async function apiQuery(params) {
  const url = new URL(API_BASE);
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Wikimedia API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Discover all files in a Wikimedia Commons category.
 * Handles pagination via cmcontinue.
 */
async function discoverCategory(categoryTitle) {
  const files = [];
  let cmcontinue = null;

  do {
    const params = {
      action: "query",
      list: "categorymembers",
      cmtitle: categoryTitle,
      cmtype: "file",
      cmlimit: "500",
    };
    if (cmcontinue) params.cmcontinue = cmcontinue;

    const data = await apiQuery(params);
    const members = data.query?.categorymembers || [];
    files.push(...members);

    cmcontinue = data.continue?.cmcontinue || null;
    if (cmcontinue) await sleep(RATE_LIMIT_MS);
  } while (cmcontinue);

  return files;
}

/**
 * Get the direct download URL and file info for a Wikimedia file.
 */
async function getFileInfo(fileTitle) {
  const data = await apiQuery({
    action: "query",
    titles: fileTitle,
    prop: "imageinfo",
    iiprop: "url|size|mime",
  });

  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];
  if (!page?.imageinfo?.[0]) return null;

  const info = page.imageinfo[0];
  return {
    url: info.url,
    size: info.size,
    mime: info.mime,
  };
}

// ─── Sign Code Extraction ──────────────────────────────────────────────────────

/**
 * Extract NOM-034-SCT sign code from a Wikimedia filename.
 *
 * Actual Wikimedia naming uses SPACES (not underscores):
 *   - "MX road sign SP-6.svg"
 *   - "MX road sign SR-9 (50).svg"     (speed limit variant)
 *   - "MX road sign SR-7A + SR-G1.svg" (combo sign)
 *   - "Mexico road sign SR-16 (2023).svg"
 *
 * Extracts the base code: SP-6, SR-9, SR-7A, etc.
 * For signs with parenthetical values like SR-9 (50), we include the value
 * to create unique codes: SR-9-50, SR-9-60, etc.
 */
function extractSignCode(filename) {
  const name = filename.replace(/^File:/, "");

  // Match: (MX|Mexico) road sign {PREFIX}-{NUMBER}{optional letter(s)}
  // Handles both spaces and underscores, and optional parenthetical values
  const match = name.match(
    /(?:MX|Mexico)[\s_]road[\s_]sign[\s_]([A-Z]{1,3}-\d+[a-zA-Z]*?)(?:\s*\((\d+)\))?(?:\s*\+.*)?\.svg$/i
  );
  if (!match) return null;

  let code = match[1].toUpperCase();

  // For speed limit signs like SR-9 (50), append the value to make unique
  if (match[2] && !is2023Value(match[2])) {
    code = `${code}-${match[2]}`;
  }

  return code;
}

/** Check if a parenthetical value is a year (2023) vs a sign parameter (50, 80) */
function is2023Value(val) {
  return val === "2023";
}

/** Check if a filename is the 2023 updated version */
function is2023Version(filename) {
  return /[\s(]2023[)\s]?\.svg$/i.test(filename) || /2023\.svg$/i.test(filename);
}

// ─── Sign Classification ───────────────────────────────────────────────────────

/**
 * Classify a sign code into NOM-034-SCT category, shape, and color.
 *
 * NOM-034-SCT sign code ranges:
 *   SP-*        = Preventivas (warning) — yellow diamond
 *   SR-1..15    = Restrictivas (limits/requirements) — red/white circle
 *   SR-16..35   = Prohibitivas (forbidden actions) — red circle w/ diagonal
 *   SR-36+      = Obligatorias (mandatory actions) — blue circle
 */
function classifySign(code) {
  const prefix = code.split("-")[0];
  const num = parseInt(code.split("-")[1], 10);

  if (prefix === "SP") {
    return { nomCategory: "warning", shape: "diamond", primaryColor: "yellow" };
  }

  if (prefix === "SR") {
    if (num <= 15) {
      return {
        nomCategory: "restrictive",
        shape: "circle",
        primaryColor: "red",
      };
    }
    if (num <= 35) {
      return {
        nomCategory: "prohibitive",
        shape: "circle",
        primaryColor: "red",
      };
    }
    // SR-36+ mandatory/obligatory
    return {
      nomCategory: "restrictive",
      shape: "circle",
      primaryColor: "blue",
    };
  }

  // SID, SIG, SIR — informational (future expansion)
  return {
    nomCategory: "informational",
    shape: "rectangle",
    primaryColor: "green",
  };
}

// ─── SVG Validation ────────────────────────────────────────────────────────────

/**
 * Validate an SVG string before writing to disk.
 * Returns { valid: boolean, issues: string[] }
 */
function validateSvg(content) {
  const issues = [];

  if (!content.includes("<svg") || !content.includes("</svg>")) {
    issues.push("Not a valid SVG (missing <svg> tags)");
  }

  if (!content.includes("viewBox")) {
    issues.push("Missing viewBox attribute");
  }

  if (Buffer.byteLength(content) > MAX_SVG_SIZE) {
    issues.push(
      `Too large: ${Math.round(Buffer.byteLength(content) / 1024)}KB (limit ${MAX_SVG_SIZE / 1024}KB)`
    );
  }

  if (/<script/i.test(content)) {
    issues.push("Contains <script> tag — security risk");
  }

  return { valid: issues.length === 0, issues };
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const force = args.includes("--force");

  console.log("Mexican Road Sign SVG Harvester");
  console.log(
    `Mode: ${dryRun ? "DRY RUN" : force ? "FORCE REDOWNLOAD" : "normal (skip existing)"}`
  );
  console.log("");

  // Ensure output directories
  await mkdir(SIGNS_DIR, { recursive: true });
  await mkdir(dirname(METADATA_OUT), { recursive: true });
  await mkdir(dirname(CONTENT_STUBS_OUT), { recursive: true });

  // ── Stage 1: Discover ────────────────────────────────────────────────────

  console.log("Stage 1: Discovering signs from Wikimedia Commons...");
  const allFiles = [];

  for (const cat of CATEGORIES) {
    const shortName = cat.replace("Category:SVG_", "").replace("_of_Mexico", "");
    console.log(`  Querying ${shortName}...`);
    const files = await discoverCategory(cat);
    console.log(`  Found ${files.length} files`);
    allFiles.push(...files.map((f) => ({ ...f, sourceCategory: cat })));
    await sleep(RATE_LIMIT_MS);
  }

  // Group by sign code, preferring 2023 versions when both exist
  const signMap = new Map();
  let skippedNoCode = 0;

  for (const file of allFiles) {
    const code = extractSignCode(file.title);
    if (!code) {
      skippedNoCode++;
      continue;
    }

    const existing = signMap.get(code);
    const thisIs2023 = is2023Version(file.title);

    // Prefer 2023 version, otherwise keep first seen
    if (!existing || (thisIs2023 && !existing.is2023)) {
      signMap.set(code, {
        file,
        code,
        is2023: thisIs2023,
        sourceCategory: file.sourceCategory,
      });
    }
  }

  console.log(
    `\n  ${signMap.size} unique sign codes (${skippedNoCode} files skipped — no parseable code)`
  );
  console.log("");

  if (dryRun) {
    console.log("Signs that would be downloaded:\n");
    const sorted = [...signMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [code, entry] of sorted) {
      const cls = classifySign(code);
      const tag2023 = entry.is2023 ? " (2023)" : "";
      console.log(`  ${code.padEnd(8)} ${cls.nomCategory.padEnd(12)} ${entry.file.title.replace("File:", "")}${tag2023}`);
    }
    console.log(`\nTotal: ${signMap.size} signs`);
    return;
  }

  // ── Stage 2: Download & Validate ─────────────────────────────────────────

  console.log("Stage 2: Downloading and validating SVGs...\n");
  const metadata = [];
  const contentStubs = {};
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  const sortedEntries = [...signMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  for (const [code, entry] of sortedEntries) {
    const localFilename = `${code}.svg`;
    const localPath = join(SIGNS_DIR, localFilename);
    const classification = classifySign(code);

    // Skip existing files unless --force
    if (!force && (await fileExists(localPath))) {
      skipped++;
      metadata.push({
        id: code,
        code,
        ...classification,
        filename: localFilename,
        localPath: `signs/${localFilename}`,
        wikimediaFile: entry.file.title.replace("File:", ""),
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(entry.file.title)}`,
        license: "CC BY-SA 4.0",
        is2023Version: entry.is2023,
        downloaded: true,
      });
      contentStubs[code] = contentStubs[code] || {
        nameEs: "",
        nameEn: "",
        descriptionEn: "",
        descriptionEs: "",
        examRelevant: false,
      };
      continue;
    }

    // Get file info (download URL)
    await sleep(RATE_LIMIT_MS);
    let fileInfo;
    try {
      fileInfo = await getFileInfo(entry.file.title);
    } catch (err) {
      console.log(`  FAIL ${code} — API error: ${err.message}`);
      failed++;
      continue;
    }

    if (!fileInfo) {
      console.log(`  FAIL ${code} — could not get file info`);
      failed++;
      continue;
    }

    if (fileInfo.mime !== "image/svg+xml") {
      console.log(`  FAIL ${code} — not SVG (${fileInfo.mime})`);
      failed++;
      continue;
    }

    // Download the SVG
    await sleep(RATE_LIMIT_MS);
    try {
      const svgRes = await fetch(fileInfo.url, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!svgRes.ok) {
        console.log(`  FAIL ${code} — HTTP ${svgRes.status}`);
        failed++;
        continue;
      }

      const svgContent = await svgRes.text();

      // Validate
      const validation = validateSvg(svgContent);
      if (!validation.valid) {
        console.log(
          `  FAIL ${code} — ${validation.issues.join(", ")}`
        );
        failed++;
        continue;
      }

      // Write to disk
      await writeFile(localPath, svgContent, "utf-8");
      const sizeKB = Math.round(Buffer.byteLength(svgContent) / 1024);
      downloaded++;
      console.log(`  OK   ${code} (${sizeKB}KB)`);

      metadata.push({
        id: code,
        code,
        ...classification,
        filename: localFilename,
        localPath: `signs/${localFilename}`,
        wikimediaFile: entry.file.title.replace("File:", ""),
        sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(entry.file.title)}`,
        license: "CC BY-SA 4.0",
        is2023Version: entry.is2023,
        fileSize: Buffer.byteLength(svgContent),
        downloaded: true,
      });

      contentStubs[code] = {
        nameEs: "",
        nameEn: "",
        descriptionEn: "",
        descriptionEs: "",
        examRelevant: false,
      };
    } catch (err) {
      console.log(`  FAIL ${code} — ${err.message}`);
      failed++;
    }
  }

  // ── Stage 3: Write metadata ──────────────────────────────────────────────

  console.log("\nStage 3: Writing metadata...");

  // Sort by code
  metadata.sort((a, b) => a.code.localeCompare(b.code));
  await writeFile(METADATA_OUT, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`  Structural metadata: ${METADATA_OUT}`);

  // Content stubs: merge into existing file without overwriting manual edits
  let finalContent = contentStubs;
  if (await fileExists(CONTENT_STUBS_OUT)) {
    try {
      const existing = JSON.parse(
        await readFile(CONTENT_STUBS_OUT, "utf-8")
      );
      // Only add new entries, never overwrite existing ones
      for (const [code, stub] of Object.entries(contentStubs)) {
        if (!existing[code]) {
          existing[code] = stub;
        }
      }
      finalContent = existing;
      console.log(`  Content stubs: ${CONTENT_STUBS_OUT} (merged new entries)`);
    } catch {
      console.log(`  Content stubs: ${CONTENT_STUBS_OUT} (created)`);
    }
  } else {
    console.log(`  Content stubs: ${CONTENT_STUBS_OUT} (created)`);
  }

  // Sort content stubs by key
  const sortedContent = Object.fromEntries(
    Object.entries(finalContent).sort((a, b) => a[0].localeCompare(b[0]))
  );
  await writeFile(
    CONTENT_STUBS_OUT,
    JSON.stringify(sortedContent, null, 2),
    "utf-8"
  );

  // ── Summary ──────────────────────────────────────────────────────────────

  console.log("\n--- Summary ---");
  console.log(`  Downloaded:       ${downloaded}`);
  console.log(`  Skipped (exist):  ${skipped}`);
  console.log(`  Failed:           ${failed}`);
  console.log(`  Total metadata:   ${metadata.length}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
