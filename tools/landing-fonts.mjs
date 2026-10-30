// Cuts the display face of the home page and the error page down to the characters their titles use in every
// locale (all of i18n/locales/*.json, so a new language is picked up by itself) and writes
// public/landing/fonts/display.woff2. Run it after changing a landing.*.title or error_page.*.title text:
// node tools/landing-fonts.mjs
//
// The face is Resource Han Rounded Heavy (github.com/CyanoHao/Resource-Han-Rounded, SIL OFL), a rounded Source Han
// Sans: one font for Chinese, Japanese, Korean and Latin, so switching languages never changes or fetches a font.
// Its Simplified Chinese build keeps the `locl` forms, which browsers pick from the page's lang. The release archive
// (70 MB, 7z) is downloaded once and the one file needed is kept in node_modules/.cache/landing-fonts.
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import SevenZip from '7z-wasm'
import subsetFont from 'subset-font'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, 'node_modules/.cache/landing-fonts')
const OUT = join(ROOT, 'public/landing/fonts')
const RELEASE = 'https://github.com/CyanoHao/Resource-Han-Rounded/releases/download/v0.990/RHR-TTF-0.990.7z'
const LICENSE = 'https://raw.githubusercontent.com/CyanoHao/Resource-Han-Rounded/master/OFL-License.txt'
const FONT = 'ResourceHanRoundedSC-Heavy.ttf'
const TITLES = ['hero', 'album', 'listen', 'discover', 'community']
const ERROR_TITLES = ['not_found', 'server', 'request']
const ALWAYS = ' ,.!?\'’-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz，。、！？：'

const exists = path => access(path).then(() => true, () => false)

async function download(url, file) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  await writeFile(file, Buffer.from(await response.arrayBuffer()))
}

async function sourceFont() {
  const font = join(CACHE, FONT)
  if (await exists(font)) return readFile(font)
  await mkdir(CACHE, { recursive: true })
  const archive = join(CACHE, 'rhr.7z')
  console.log(`Downloading ${RELEASE} …`)
  await download(RELEASE, archive)
  const wasmBinary = await readFile(join(dirname(createRequire(import.meta.url).resolve('7z-wasm')), '7zz.wasm'))
  const zip = await SevenZip({ wasmBinary, print: () => {} })
  zip.FS.mkdir('/cache')
  zip.FS.mount(zip.NODEFS, { root: CACHE }, '/cache')
  zip.callMain(['x', '/cache/rhr.7z', '-o/cache', FONT, '-y'])
  await rm(archive)
  return readFile(font)
}

let text = ALWAYS
const locales = (await readdir(join(ROOT, 'i18n/locales'))).filter(name => name.endsWith('.json'))
for (const name of locales) {
  const { landing, error_page: errorPage } = JSON.parse(await readFile(join(ROOT, 'i18n/locales', name), 'utf8'))
  for (const key of TITLES) text += landing?.[key]?.title ?? ''
  for (const key of ERROR_TITLES) text += errorPage?.[key]?.title ?? ''
}
const characters = [...new Set(text.replace(/\s/g, ''))].join('') + ' '

await mkdir(OUT, { recursive: true })
const font = await subsetFont(await sourceFont(), characters, { targetFormat: 'woff2' })
await writeFile(join(OUT, 'display.woff2'), font)
const license = join(CACHE, 'OFL-License.txt')
if (!(await exists(license))) await download(LICENSE, license)
await writeFile(join(OUT, 'display.OFL.txt'), await readFile(license))
console.log(`display.woff2: ${[...characters].length} characters from ${locales.length} locales, ${(font.length / 1024).toFixed(1)} KB`)
