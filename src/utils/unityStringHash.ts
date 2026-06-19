export function unityStringHash(text: string): number {
  let hash1 = 0x1505
  let hash2 = 0x1505
  let i = 0

  while (i < text.length) {
    hash1 = (Math.imul(hash1, 0x21) ^ text.charCodeAt(i)) | 0
    i++
    if (i >= text.length) break
    hash2 = (Math.imul(hash2, 0x21) ^ text.charCodeAt(i)) | 0
    i++
  }

  return (Math.imul(hash2, 0x5d588b65) + hash1) | 0
}
