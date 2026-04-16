/**
 * Local text embedding using deterministic random projection.
 * Produces 1536-dim vectors (matching common Qdrant collection configs)
 * without any external API. Uses word-level hashing for reproducible similarity.
 */

const EMBEDDING_DIM = 1536

// Deterministic hash: FNV-1a 32-bit
function fnv1a(str: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

// Seeded pseudo-random number generator (xorshift32)
function xorshift32(seed: number): () => number {
  let state = seed || 1
  return () => {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    return (state >>> 0) / 0xFFFFFFFF
  }
}

/**
 * Generate a 1536-dim embedding vector for a text string.
 * Uses random indexing: each unique token hashes to a sparse
 * pattern in the vector, and all token patterns are summed + normalized.
 */
export function embedText(text: string): number[] {
  const vector = new Float64Array(EMBEDDING_DIM)

  // Normalize and tokenize
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1)

  if (tokens.length === 0) {
    // Return a zero vector for empty input
    return Array.from(vector)
  }

  // For each token, generate a sparse projection and add to vector
  const projectionsPerToken = 8 // each token touches 8 dimensions
  for (const token of tokens) {
    const hash = fnv1a(token)
    const rng = xorshift32(hash)
    for (let j = 0; j < projectionsPerToken; j++) {
      const dim = Math.floor(rng() * EMBEDDING_DIM)
      const sign = rng() > 0.5 ? 1 : -1
      vector[dim] += sign
    }
  }

  // L2 normalize
  let norm = 0
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    norm += vector[i] * vector[i]
  }
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vector[i] /= norm
    }
  }

  return Array.from(vector)
}

/**
 * Batch embed multiple texts.
 */
export function embedTexts(texts: string[]): number[][] {
  return texts.map(embedText)
}
