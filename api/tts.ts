import type { VercelRequest, VercelResponse } from '@vercel/node'

const VOICE_ID = 'pYh25m9UP0bBcXUYv3mT' // "AussieVoice", picked in the user's ElevenLabs account
const MODEL_ID = 'eleven_multilingual_v2' // handles Norwegian text with a non-Norwegian voice
const MAX_CHARS = 2000 // safety cap - ElevenLabs bills per character

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const accessKey = process.env.CHAT_ACCESS_KEY
  if (accessKey && req.headers['x-chat-access-key'] !== accessKey) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured on the server' })
    return
  }

  const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!rawText) {
    res.status(400).json({ error: 'Expected { text: string }' })
    return
  }
  const text = rawText.slice(0, MAX_CHARS)

  try {
    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: MODEL_ID }),
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      console.error('elevenlabs error', upstream.status, detail)
      res.status(502).json({ error: 'Kunne ikke generere tale akkurat nå.' })
      return
    }

    const audio = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).send(audio)
  } catch (err) {
    console.error('tts handler error', err)
    res.status(502).json({ error: 'Kunne ikke nå tale-tjenesten. Prøv igjen om litt.' })
  }
}
