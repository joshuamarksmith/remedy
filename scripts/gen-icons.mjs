// Generate PNG app icons with no external dependencies.
// Renders a kettlebell glyph via signed-distance fields (anti-aliased) and
// encodes a PNG using Node's built-in zlib. Full-bleed square so the same
// asset works as an Android maskable icon and an iOS apple-touch-icon.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// ---- minimal PNG encoder (RGBA, 8-bit) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rows with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- geometry helpers ----
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// coverage from a signed distance: ~1px anti-aliasing
const cov = (sd, aa) => clamp01(0.5 - sd / aa);

function render(S) {
  const buf = Buffer.alloc(S * S * 4);
  const aa = S / 256; // anti-alias width scales with size

  // bell geometry (normalized to S)
  const bodyC = [0.5 * S, 0.64 * S];
  const bodyR = 0.245 * S;
  const handleC = [0.5 * S, 0.355 * S];
  const handleR = 0.15 * S; // ring centerline
  const handleT = 0.04 * S; // half-thickness

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      // background vertical gradient
      const g = y / S;
      let r = lerp(0x1a, 0x0a, g);
      let gg = lerp(0x1a, 0x0a, g);
      let b = lerp(0x1f, 0x0c, g);

      // bell coverage = body circle OR handle ring
      const dBody = Math.hypot(x - bodyC[0], y - bodyC[1]) - bodyR;
      const ringDist = Math.abs(Math.hypot(x - handleC[0], y - handleC[1]) - handleR) - handleT;
      const bellSd = Math.min(dBody, ringDist);
      const bc = cov(bellSd, aa);

      if (bc > 0) {
        // ember gradient over the bell vertical extent
        const t = clamp01((y - 0.18 * S) / (0.7 * S));
        const er = lerp(0xff, 0xff, t);
        const eg = lerp(0x85, 0x5a, t);
        const eb = lerp(0x5e, 0x2a, t);
        r = lerp(r, er, bc);
        gg = lerp(gg, eg, bc);
        b = lerp(b, eb, bc);
      }
      buf[i] = Math.round(r);
      buf[i + 1] = Math.round(gg);
      buf[i + 2] = Math.round(b);
      buf[i + 3] = 255;
    }
  }
  return encodePNG(S, S, buf);
}

for (const size of [192, 512, 180]) {
  const png = render(size);
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  writeFileSync(new URL(name, OUT), png);
  console.log('wrote', name, png.length, 'bytes');
}
