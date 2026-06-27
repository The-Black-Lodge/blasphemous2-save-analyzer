import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const [
  rippedDir = path.join(__dirname, "../../ripped/Assets/#Art/Sprites/UI/Hud"),
  outJson = path.join(__dirname, "../src/data/hud-sprites.json"),
  outCss = path.join(__dirname, "../src/styles/hud-sprites.css"),
  publicDir = path.join(__dirname, "../public/sprites"),
  assetBase = "/blasphemous2-save-analyzer/",
  scaleRaw = "2",
  assetRipperHudDir = path.join(
    __dirname,
    "../../AssetRipper_export_20260621_154214/ExportedProject/Assets/#Art/Sprites/UI/Hud",
  ),
] = process.argv.slice(2)

const scale = Number(scaleRaw)

const v1SheetId = "player-HUD-spritesheet"
const v1SheetCollection = "cab-0e1f39bc4663c7e421de0d93a0915123"
const v1SheetTexturePathId = -2814398073287607514

const v2SheetId = "player-HUD-v2-spritesheet"

const v1IncludePatterns = [
  /^player-HUD-flask-[0-3]-full$/,
  /^player-HUD-flask-golden-[0-3]-full$/,
  /^cherub-counter-pop-up-icon$/,
  /^popup-bg$/,
  /^service-menu-arrow$/,
]

const v2IncludePatterns = [
  /^Player-HUD-penitence-life$/,
  /^Player-HUD-penitence-life-empty$/,
  /^Player-HUD-penitence-life-link$/,
]

function pngSize(file) {
  const buf = fs.readFileSync(file)
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

function walkJsonFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...walkJsonFiles(full))
    else if (entry.name.endsWith(".json")) files.push(full)
  }
  return files
}

function v1SpriteClassName(name) {
  if (name === "cherub-counter-pop-up-icon") return "cherub"
  if (name === "service-menu-arrow") return "menu-arrow"
  return name.replace(/^player-HUD-flask-/, "flask-")
}

function v2SpriteClassName(name) {
  return name
    .replace(/^Player-HUD-penitence-life-empty$/, "life-orb-empty")
    .replace(/^Player-HUD-penitence-life-link$/, "life-orb-link")
    .replace(/^Player-HUD-penitence-life$/, "life-orb-full")
}

function parseAssetRipperSprite(file) {
  const text = fs.readFileSync(file, "utf8")
  const name = text.match(/^  m_Name: (.+)$/m)?.[1]?.trim()
  if (!name) return null

  const rectMatch = text.match(
    /textureRect:\s*\n\s*serializedVersion: 2\s*\n\s*x: (\d+)\s*\n\s*y: (\d+)\s*\n\s*width: (\d+)\s*\n\s*height: (\d+)/,
  )
  if (!rectMatch) return null

  return {
    name,
    x: Number(rectMatch[1]),
    y: Number(rectMatch[2]),
    w: Number(rectMatch[3]),
    h: Number(rectMatch[4]),
  }
}

function loadExistingSprites() {
  if (!fs.existsSync(outJson)) return { atlas: {}, sprites: {} }
  const data = JSON.parse(fs.readFileSync(outJson, "utf8"))
  return { atlas: data.atlas ?? {}, sprites: data.sprites ?? {} }
}

function collectV1Sprites(atlas) {
  const sprites = {}
  const sheetFile = path.join(rippedDir, `${v1SheetId}.png`)
  if (!fs.existsSync(sheetFile)) return sprites

  atlas[v1SheetId] = pngSize(sheetFile)

  for (const file of walkJsonFiles(rippedDir)) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    const name = data.m_Name
    if (!v1IncludePatterns.some((pattern) => pattern.test(name))) continue

    const rect = data.m_RD?.m_TextureRect
    const collection = data.m_RD?.m_Texture?.m_Collection
    const texturePathId = data.m_RD?.m_Texture?.m_PathID
    if (!rect || rect.m_Width <= 0 || rect.m_Height <= 0) continue
    if (collection !== v1SheetCollection || texturePathId !== v1SheetTexturePathId) {
      continue
    }

    sprites[v1SpriteClassName(name)] = {
      name,
      sheet: v1SheetId,
      x: rect.m_X,
      y: rect.m_Y,
      w: rect.m_Width,
      h: rect.m_Height,
    }
  }

  return sprites
}

function collectV2Sprites(atlas) {
  const sprites = {}
  const sheetFile = path.join(assetRipperHudDir, "Player-HUD-v2-spritesheet.png")
  if (!fs.existsSync(sheetFile)) return sprites

  atlas[v2SheetId] = pngSize(sheetFile)

  for (const entry of fs.readdirSync(assetRipperHudDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".asset")) continue
    const parsed = parseAssetRipperSprite(path.join(assetRipperHudDir, entry.name))
    if (!parsed || !v2IncludePatterns.some((pattern) => pattern.test(parsed.name))) {
      continue
    }

    sprites[v2SpriteClassName(parsed.name)] = {
      name: parsed.name,
      sheet: v2SheetId,
      x: parsed.x,
      y: parsed.y,
      w: parsed.w,
      h: parsed.h,
    }
  }

  return sprites
}

const existing = loadExistingSprites()
const atlas = { ...existing.atlas }
let sprites = { ...existing.sprites }

const v1Sprites = collectV1Sprites(atlas)
if (Object.keys(v1Sprites).length > 0) {
  sprites = { ...sprites, ...v1Sprites }
}

const v2Sprites = collectV2Sprites(atlas)
sprites = { ...sprites, ...v2Sprites }

fs.mkdirSync(publicDir, { recursive: true })

const v1SheetFile = path.join(rippedDir, `${v1SheetId}.png`)
if (fs.existsSync(v1SheetFile)) {
  fs.copyFileSync(v1SheetFile, path.join(publicDir, `${v1SheetId}.png`))
}

const v2SheetFile = path.join(assetRipperHudDir, "Player-HUD-v2-spritesheet.png")
if (fs.existsSync(v2SheetFile)) {
  fs.copyFileSync(v2SheetFile, path.join(publicDir, `${v2SheetId}.png`))
}

fs.mkdirSync(path.dirname(outJson), { recursive: true })
fs.writeFileSync(outJson, JSON.stringify({ atlas, sprites, scale }, null, 2))

const sheetUrl = (sheetId) => `url('${assetBase}sprites/${sheetId}.png')`
const lines = [
  "/* Generated by tools/build-hud-sprites.mjs — do not edit by hand. */",
  "/* W3Schools-style sprites: native atlas coords, no background-size. */",
  "",
  ":root {",
  `  --hud-sprite-scale: ${scale};`,
  "}",
  "",
  ".hud-sprite {",
  "  display: inline-block;",
  "  flex: 0 0 auto;",
  "  background-repeat: no-repeat;",
  "  image-rendering: pixelated;",
  "  transform: scale(var(--hud-sprite-scale));",
  "  transform-origin: top left;",
  "}",
  "",
]

for (const [className, rect] of Object.entries(sprites).sort(([a], [b]) =>
  a.localeCompare(b, undefined, { numeric: true }),
)) {
  const sheetHeight = atlas[rect.sheet]?.h
  if (!sheetHeight) continue
  const cssX = rect.x
  const cssY = sheetHeight - rect.y - rect.h
  lines.push(
    `.hud-sprite--${className} {`,
    `  width: ${rect.w}px;`,
    `  height: ${rect.h}px;`,
    `  background-image: ${sheetUrl(rect.sheet)};`,
    `  background-position: ${-cssX}px ${-cssY}px;`,
    "}",
    "",
  )
}

fs.writeFileSync(outCss, lines.join("\n"))

console.log(`Wrote ${Object.keys(sprites).length} HUD sprites`)
console.log(`JSON -> ${outJson}`)
console.log(`CSS  -> ${outCss}`)
