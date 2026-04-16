import { embedTexts } from '../_shared/embeddings.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 0) chunks.push(chunk)
    start += chunkSize - overlap
  }
  return chunks
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const QDRANT_URL = Deno.env.get('QDRANT_URL')
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY')

    if (!QDRANT_URL || !QDRANT_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Qdrant API keys in secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 1: Extract text from file
    const text = await file.text()
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'File is empty or unreadable' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 2: Chunk the text
    const chunks = chunkText(text)
    if (chunks.length === 0) {
      return new Response(JSON.stringify({ error: 'No chunks produced from file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Step 3: Generate embeddings locally (no external API)
    const allEmbeddings = embedTexts(chunks)

    // Step 4: Upsert into Qdrant
    const timestamp = new Date().toISOString()
    const points = chunks.map((chunk, idx) => ({
      id: crypto.randomUUID(),
      vector: allEmbeddings[idx],
      payload: {
        text: chunk,
        document_name: file.name,
        chunk_index: idx,
        upload_timestamp: timestamp,
      },
    }))

    const qdrantRes = await fetch(
      `${QDRANT_URL}/collections/voxflow_knowledge/points`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'api-key': QDRANT_API_KEY },
        body: JSON.stringify({ points }),
      }
    )

    if (!qdrantRes.ok) {
      const errText = await qdrantRes.text()
      throw new Error(`Qdrant upsert failed (${qdrantRes.status}): ${errText}`)
    }

    await qdrantRes.text() // consume body

    return new Response(
      JSON.stringify({
        success: true,
        fileName: file.name,
        chunks: chunks.length,
        vectors: allEmbeddings.length,
        timestamp,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('voxflow-ingest error:', e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
