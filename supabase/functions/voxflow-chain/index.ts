import { embedText } from '../_shared/embeddings.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transcript } = await req.json()
    if (!transcript || typeof transcript !== 'string') {
      return new Response(JSON.stringify({ error: 'transcript is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    const QDRANT_URL = Deno.env.get('QDRANT_URL')
    const QDRANT_API_KEY = Deno.env.get('QDRANT_API_KEY')

    const steps: string[] = []

    // Step 1: Local embedding (no external API needed)
    steps.push('embedding')
    const embedding = embedText(transcript)

    // Step 2: Qdrant vector search
    steps.push('qdrant')
    let results: Array<{ score?: number; payload?: { text?: string } }> = []
    let topScore: string | number = 'No results'

    if (QDRANT_URL && QDRANT_API_KEY) {
      const qdrantRes = await fetch(
        `${QDRANT_URL}/collections/voxflow_knowledge/points/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-key': QDRANT_API_KEY },
          body: JSON.stringify({ vector: embedding, limit: 5, with_payload: true }),
        }
      )
      if (qdrantRes.ok) {
        const qdrantData = await qdrantRes.json()
        results = qdrantData?.result || qdrantData || []
        if (Array.isArray(results) && results.length > 0) {
          topScore = results[0]?.score ?? 'No score'
        }
      } else {
        const errText = await qdrantRes.text()
        console.error('Qdrant search error:', qdrantRes.status, errText)
        // Continue without search results — Claude will use general knowledge
      }
    }

    // Step 3: Claude response with KB context
    steps.push('claude')
    const context = Array.isArray(results)
      ? results
          .slice(0, 3)
          .map((r) => r.payload?.text || '')
          .filter(Boolean)
          .join('\n\n')
      : ''

    let responseText = ''
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const prompt = `Query: ${transcript}\n\nKB Context: ${context || 'None—use general dev knowledge.'}`

    // Try Anthropic first, fall back to Lovable AI Gateway
    if (ANTHROPIC_API_KEY) {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json()
        responseText = claudeData.content?.[0]?.text || ''
      } else {
        const errText = await claudeRes.text()
        console.error('Anthropic failed, trying Lovable AI Gateway:', claudeRes.status, errText)
      }
    }

    // Fallback: Lovable AI Gateway
    if (!responseText && LOVABLE_API_KEY) {
      const gatewayRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (gatewayRes.ok) {
        const gatewayData = await gatewayRes.json()
        responseText = gatewayData.choices?.[0]?.message?.content || ''
      } else {
        const errText = await gatewayRes.text()
        console.error('Lovable AI Gateway also failed:', gatewayRes.status, errText)
      }
    }

    if (!responseText) {
      responseText = 'Unable to generate a response — both Anthropic and fallback APIs are unavailable. Please check your API credits.'
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        topScore,
        embeddingDims: embedding.length,
        steps,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('voxflow-chain error:', e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
