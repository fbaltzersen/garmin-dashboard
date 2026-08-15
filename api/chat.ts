import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 700

const SYSTEM_PROMPT = `\
Du er TEMPO, en erfaren løpecoach integrert i utøverens personlige treningsdashboard. \
Utøverens mål er å løpe 5 km under 20:00. Du får tilsendt et JSON-utdrag av deres nyeste \
Garmin-data og AI-treningsplan (VO2max, treningsstatus, ukevolum, nylige økter, \
restitusjonsmål, gjeldende plan, planetterlevelse) som kontekst for spørsmålet.

Svar kort, konkret og datadrevet - vis til faktiske tall fra konteksten fremfor generiske råd. \
Svar alltid på norsk (bokmål), i en varm men direkte tone, som en coach som kjenner utøverens \
faktiske treningshistorikk. Hvis noe data mangler i konteksten, si det kort i stedet for å \
gjette. Hold svarene til noen få setninger med mindre spørsmålet eksplisitt ber om mer detalj \
(f.eks. en full øktforklaring).`

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

interface ChatRequestBody {
  message: string
  history?: ChatMessage[]
  context?: unknown
}

function isChatRequestBody(body: unknown): body is ChatRequestBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.message !== 'string' || !b.message.trim()) return false
  if (b.history != null && !Array.isArray(b.history)) return false
  return true
}

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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on the server' })
    return
  }

  if (!isChatRequestBody(req.body)) {
    res.status(400).json({ error: 'Expected { message: string, history?: [], context?: {} }' })
    return
  }

  const { message, history = [], context } = req.body

  const contextBlock = context
    ? `Her er utøverens nyeste treningsdata som JSON:\n\n${JSON.stringify(context)}\n\n`
    : 'Ingen treningsdata er tilgjengelig for dette spørsmålet - vær tydelig på det i svaret. '

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        ...history.slice(-10).map((m) => ({
          role: m.role,
          content: m.text,
        })),
        {
          role: 'user' as const,
          content: `${contextBlock}Spørsmål: ${message}`,
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      res.status(200).json({ reply: 'Jeg kan dessverre ikke svare på det spørsmålet.' })
      return
    }

    const text = response.content.find((block) => block.type === 'text')?.text
    res.status(200).json({ reply: text ?? 'Fikk ikke generert et svar - prøv igjen.' })
  } catch (err) {
    console.error('chat handler error', err)
    res.status(502).json({ error: 'Kunne ikke nå AI-tjenesten. Prøv igjen om litt.' })
  }
}
