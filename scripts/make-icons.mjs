/**
 * Rasterises the PWA icons from SVG sources.
 *
 * Run with `npm run icons` after changing the artwork; the PNGs are committed so
 * neither CI nor a fresh clone needs sharp to build the app.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'icons')

const PAPER = '#faf8f4'
const COVER = '#55504a'
const SPINE = '#2f2b26'

/** The plain icon fills its canvas; the maskable one keeps a safe margin so
 *  Android can crop it to a circle without eating the notebook. */
function iconSvg({ maskable }) {
  const s = maskable ? 0.62 : 0.84
  const offset = (1 - s) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1">
  <rect width="1" height="1" fill="${PAPER}"/>
  <g transform="translate(${offset} ${offset}) scale(${s})">
    <g transform="scale(0.015625)">
      <rect x="12" y="8" width="6" height="48" rx="2" fill="${SPINE}"/>
      <path d="M16 8h32a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H16z" fill="${COVER}"/>
      <rect x="24" y="17" width="21" height="30" rx="3" fill="${PAPER}"/>
      <g fill="none" stroke="${SPINE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M30 26h5.5a3.2 3.2 0 0 1 0 6.4h-4.5M31 32.4h4.5a3.2 3.2 0 0 1 0 6.4h-5.5"/>
        <path d="M34.5 22v21"/>
      </g>
    </g>
  </g>
</svg>`
}

await mkdir(outDir, { recursive: true })

const jobs = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
]

for (const job of jobs) {
  const png = await sharp(Buffer.from(iconSvg({ maskable: job.maskable })))
    .resize(job.size, job.size)
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(path.join(outDir, job.name), png)
  console.log(`wrote icons/${job.name} (${job.size}px)`)
}
