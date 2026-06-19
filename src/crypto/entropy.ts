export function mixEntropy(primary: Uint8Array, supplemental: Uint8Array): Uint8Array {
  if (primary.length !== supplemental.length) {
    throw new Error('Entropy buffers must have the same length');
  }
  const result = new Uint8Array(primary.length);
  for (let i = 0; i < primary.length; i++) {
    result[i] = primary[i] ^ supplemental[i];
  }
  return result;
}

export async function collectMotionEntropy(sampleCount: number = 64): Promise<Uint8Array> {
  const entropy = new Uint8Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const timestamp = performance.now();
    const fractional = timestamp - Math.floor(timestamp);
    const raw = Math.floor(fractional * 256);
    entropy[i] = raw & 0xff;
  }
  return entropy;
}
