/**
 * Splits two image-traced SVG sheets into individual character SVGs.
 *
 * File 1 (TEREKA BITMOJI -01.svg) — 24 avatars, 6 cols × 4 rows
 *   Grid origin: x₀=143, y₀=92  |  cell: 102px wide × 110px tall
 *
 * File 2 (TEREKA BITMOJI -02.svg) — 6 mascot moods, 3 cols × 2 rows
 *   Grid origin: x₀=128, y₀=38  |  cell: 172px wide × 260px tall
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ROOT = join(import.meta.dir, '..')
const DOWNLOADS = '/Users/spooky/Downloads'

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Extract defs block (includes the shared style classes) */
function extractDefs(svgContent: string): string {
  const m = svgContent.match(/<defs>[\s\S]*?<\/defs>/)
  return m ? m[0] : ''
}

/** Extract all <path .../> lines */
function extractPaths(svgContent: string): string[] {
  const paths: string[] = []
  const re = /<path[^>]*\/>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(svgContent)) !== null) {
    paths.push(m[0])
  }
  return paths
}

/** Get first M x,y from a path's d attribute */
function getFirstCoord(pathEl: string): { x: number; y: number } | null {
  const m = pathEl.match(/d="M\s*([-\d.]+)[,\s]([-\d.]+)/)
  if (!m) return null
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) }
}

interface BBox { minX: number; minY: number; maxX: number; maxY: number }

/** Compute bounding box from all first-coords in a path list (approximate but sufficient) */
function bbox(paths: string[]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of paths) {
    const c = getFirstCoord(p)
    if (!c) continue
    if (c.x < minX) minX = c.x
    if (c.y < minY) minY = c.y
    if (c.x > maxX) maxX = c.x
    if (c.y > maxY) maxY = c.y
  }
  return { minX, minY, maxX, maxY }
}

function buildSvg(defs: string, paths: string[], pad = 8): string {
  if (paths.length === 0) return ''
  const bb = bbox(paths)
  const x = bb.minX - pad
  const y = bb.minY - pad
  const w = bb.maxX - bb.minX + pad * 2
  const h = bb.maxY - bb.minY + pad * 2
  const pathBlock = paths.map(p => `    ${p}`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}">
  ${defs}
  <g>
${pathBlock}
  </g>
</svg>`
}

// ─── split logic ──────────────────────────────────────────────────────────────

function splitGrid(
  svgPath: string,
  x0: number,
  y0: number,
  cellW: number,
  cellH: number,
  cols: number,
  rows: number,
  outDir: string,
  prefix: string,
) {
  console.log(`\nReading ${svgPath}…`)
  const content = readFileSync(svgPath, 'utf-8')
  const defs = extractDefs(content)
  const allPaths = extractPaths(content)
  console.log(`  ${allPaths.length} paths found`)

  // Bucket paths into grid cells
  const cells: Map<string, string[]> = new Map()
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.set(`${c},${r}`, [])
    }
  }

  let unplaced = 0
  for (const path of allPaths) {
    const coord = getFirstCoord(path)
    if (!coord) { unplaced++; continue }
    const col = Math.floor((coord.x - x0) / cellW)
    const row = Math.floor((coord.y - y0) / cellH)
    if (col < 0 || col >= cols || row < 0 || row >= rows) { unplaced++; continue }
    cells.get(`${col},${row}`)!.push(path)
  }
  if (unplaced > 0) console.log(`  ${unplaced} paths outside grid (skipped)`)

  mkdirSync(outDir, { recursive: true })

  let written = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = c + r * cols
      const paths = cells.get(`${c},${r}`) ?? []
      if (paths.length === 0) {
        console.log(`  [${c},${r}] → ${prefix}-${idx}: EMPTY`)
        continue
      }
      const svg = buildSvg(defs, paths)
      const outPath = join(outDir, `${prefix}-${idx}.svg`)
      writeFileSync(outPath, svg, 'utf-8')
      console.log(`  [${c},${r}] → ${prefix}-${idx}.svg  (${paths.length} paths)`)
      written++
    }
  }
  console.log(`  ✓ ${written} files written to ${outDir}`)
}

// ─── run ──────────────────────────────────────────────────────────────────────

// File 1: 24 avatars, 6 cols × 4 rows
splitGrid(
  join(DOWNLOADS, 'TEREKA BITMOJI -01.svg'),
  143, 92,   // grid origin
  102, 110,  // cell size
  6, 4,      // cols, rows
  join(ROOT, 'public/avatars'),
  'avatar',
)

// File 2: 6 mascot moods, 3 cols × 2 rows
splitGrid(
  join(DOWNLOADS, 'TEREKA BITMOJI -02.svg'),
  128, 38,    // grid origin
  172, 260,   // cell size
  3, 2,       // cols, rows
  join(ROOT, 'public/mascot'),
  'mood',
)

console.log('\nDone.')
