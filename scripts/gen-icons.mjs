// PWA 아이콘 생성기 — 외부 의존성 없이 순수 Node(zlib)로 PNG를 만든다.
// 냉장고 문(웜 화이트) 위에 피치색 둥근 사각형 + 흰 냉장고 실루엣.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePNG(size, pixels) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const PEACH = hex('#FFD9C8')
const WHITE = hex('#FFFFFF')
const INK = hex('#4A4238')

function inRoundRect(x, y, x0, y0, w, h, r) {
  if (x < x0 || x >= x0 + w || y < y0 || y >= y0 + h) return false
  const cx = Math.max(x0 + r, Math.min(x, x0 + w - r))
  const cy = Math.max(y0 + r, Math.min(y, y0 + h - r))
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r || (x >= x0 + r && x < x0 + w - r) || (y >= y0 + r && y < y0 + h - r)
}

function drawIcon(size) {
  const px = Buffer.alloc(size * size * 4)
  const s = size / 512 // 512 기준 좌표계
  // 냉장고 본체 / 문 경계 / 손잡이 (512 기준)
  const fridge = { x: 156, y: 96, w: 200, h: 320, r: 28 }
  const doorY = 96 + 110 // 냉동칸 경계선
  const handle = { x: 186, w: 14, h1: [130, 180], h2: [232, 300] }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const X = x / s, Y = y / s
      let c = PEACH // 배경 (maskable 대응: 전체 채움)
      if (inRoundRect(X, Y, fridge.x, fridge.y, fridge.w, fridge.h, fridge.r)) {
        c = WHITE
        if (Math.abs(Y - doorY) < 5) c = PEACH // 문 경계선
        if (X >= handle.x && X < handle.x + handle.w) {
          if ((Y >= handle.h1[0] && Y < handle.h1[1]) || (Y >= handle.h2[0] && Y < handle.h2[1])) c = INK
        }
      }
      const i = (y * size + x) * 4
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255
    }
  }
  return encodePNG(size, px)
}

mkdirSync('public/icons', { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, drawIcon(size))
  console.log(`public/icons/icon-${size}.png 생성`)
}
