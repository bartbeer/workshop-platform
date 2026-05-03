/**
 * Read width/height from PNG / JPEG / WebP buffers (no native deps).
 * Used to enforce exact pixel dimensions on uploaded workshop images.
 */

export type ImageDimensions = { width: number; height: number };

function readUInt32BE(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] ?? 0) << 24) |
    ((buf[offset + 1] ?? 0) << 16) |
    ((buf[offset + 2] ?? 0) << 8) |
    (buf[offset + 3] ?? 0)
  ) >>> 0;
}

function readUInt16BE(buf: Uint8Array, offset: number): number {
  return (((buf[offset] ?? 0) << 8) | (buf[offset + 1] ?? 0)) >>> 0;
}

function readUInt24LE(buf: Uint8Array, offset: number): number {
  return (
    (buf[offset] ?? 0) | ((buf[offset + 1] ?? 0) << 8) | ((buf[offset + 2] ?? 0) << 16)
  ) >>> 0;
}

function pngDimensions(buf: Uint8Array): ImageDimensions | null {
  if (buf.length < 24) return null;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i += 1) {
    if (buf[i] !== sig[i]) return null;
  }
  const width = readUInt32BE(buf, 16);
  const height = readUInt32BE(buf, 20);
  if (width < 1 || height < 1) return null;
  return { width, height };
}

function jpegDimensions(buf: Uint8Array): ImageDimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    i += 2;
    if (marker === 0xd9) break;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (i + 2 > buf.length) return null;
    const segLen = readUInt16BE(buf, i);
    if (segLen < 2 || i + segLen > buf.length) return null;
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      if (segLen < 7) return null;
      const height = readUInt16BE(buf, i + 3);
      const width = readUInt16BE(buf, i + 5);
      if (width < 1 || height < 1) return null;
      return { width, height };
    }
    i += segLen;
  }
  return null;
}

function webpVp8LossyDimensions(payload: Uint8Array): ImageDimensions | null {
  // VP8 keyframe: sync 0x9d 0x01 0x2a, then width/height as 14-bit LE fields
  if (payload.length < 10) return null;
  if (payload[0] !== 0x9d || payload[1] !== 0x01 || payload[2] !== 0x2a) return null;
  const w = readUInt16LE(payload, 3) & 0x3fff;
  const h = readUInt16LE(payload, 5) & 0x3fff;
  if (w < 1 || h < 1) return null;
  return { width: w, height: h };
}

function readUInt16LE(buf: Uint8Array, offset: number): number {
  return ((buf[offset] ?? 0) | ((buf[offset + 1] ?? 0) << 8)) >>> 0;
}

/** VP8L: after signature 0x2f, width/height are 14-bit fields (value + 1), LSB-first bitstream. */
function webpVp8LosslessDimensions(chunkData: Uint8Array): ImageDimensions | null {
  if (chunkData.length < 5 || chunkData[0] !== 0x2f) return null;
  let byteIdx = 1;
  let bitInByte = 0;
  const readBits = (n: number): number => {
    let val = 0;
    for (let i = 0; i < n; i++) {
      if (byteIdx >= chunkData.length) return 0;
      const bit = (chunkData[byteIdx]! >> bitInByte) & 1;
      val |= bit << i;
      bitInByte += 1;
      if (bitInByte === 8) {
        bitInByte = 0;
        byteIdx += 1;
      }
    }
    return val;
  };
  const wMinus1 = readBits(14);
  const hMinus1 = readBits(14);
  const width = wMinus1 + 1;
  const height = hMinus1 + 1;
  if (width < 1 || height < 1) return null;
  return { width, height };
}

function webpVp8xDimensions(payload: Uint8Array): ImageDimensions | null {
  if (payload.length < 10) return null;
  const width = readUInt24LE(payload, 4) + 1;
  const height = readUInt24LE(payload, 7) + 1;
  if (width < 1 || height < 1) return null;
  return { width, height };
}

function webpDimensions(buf: Uint8Array): ImageDimensions | null {
  if (buf.length < 16) return null;
  const riff = String.fromCharCode(buf[0]!, buf[1]!, buf[2]!, buf[3]!);
  const webp = String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!);
  if (riff !== "RIFF" || webp !== "WEBP") return null;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const tag = String.fromCharCode(
      buf[offset]!,
      buf[offset + 1]!,
      buf[offset + 2]!,
      buf[offset + 3]!,
    );
    const chunkSize =
      buf[offset + 4]! |
      (buf[offset + 5]! << 8) |
      (buf[offset + 6]! << 16) |
      (buf[offset + 7]! << 24);
    const dataStart = offset + 8;
    const padded = chunkSize + (chunkSize % 2);
    if (dataStart + chunkSize > buf.length) return null;
    const chunkData = buf.subarray(dataStart, dataStart + chunkSize);

    if (tag === "VP8X") {
      const d = webpVp8xDimensions(chunkData);
      if (d) return d;
    } else if (tag === "VP8 ") {
      const d = webpVp8LossyDimensions(chunkData);
      if (d) return d;
    } else if (tag === "VP8L") {
      const d = webpVp8LosslessDimensions(chunkData);
      if (d) return d;
    }

    offset = dataStart + padded;
  }
  return null;
}

export function getImageDimensionsFromBuffer(buffer: ArrayBuffer): ImageDimensions | null {
  const buf = new Uint8Array(buffer);
  return pngDimensions(buf) ?? jpegDimensions(buf) ?? webpDimensions(buf);
}
