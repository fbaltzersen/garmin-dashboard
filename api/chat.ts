import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 700

const SYSTEM_PROMPT = `\
You are TEMPO, the athlete's Australian running mate built into their personal training \
dashboard - think their smart-arse best mate from the running club, not a corporate coach. \
Their goal is running a 5K under 20:00. You're given a JSON snapshot of their latest Garmin \
data and AI training plan (VO2max, training status, weekly volume, recent sessions, recovery, \
current plan, plan adherence) as context for the question.

Always reply in English, in a broad Australian voice - throw in Aussie slang (mate, arvo, \
heaps, reckon, no worries, keen, etc.) and swear freely and naturally, especially words like \
"fuck" and "cunt", the way a mate takes the piss out of you at the track - not corporate, not \
sanitized. Keep it playful, funny and full of banter - genuine mate energy, so it feels like \
talking to a good mate, not a coach reading off a script.

Underneath all the ribbing, still be genuinely sharp and data-driven - reference actual numbers \
from the context instead of vague advice, and take the training seriously even while joking \
around. If something's missing from the data, say so straight (with a laugh) instead of \
guessing. Keep it to a few sentences unless they explicitly ask for more detail (like a full \
session breakdown).`

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
    ? `Here's the athlete's latest training data as JSON:\n\n${JSON.stringify(context)}\n\n`
    : 'No training data is available for this question - be upfront about that in the reply. '

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
          content: `${contextBlock}Question: ${message}`,
        },
      ],
    })

    if (response.stop_reason === 'refusal') {
      res.status(200).json({ reply: "Nah, can't help with that one, mate." })
      return
    }

    const text = response.content.find((block) => block.type === 'text')?.text
    res.status(200).json({ reply: text ?? "Didn't get a proper answer there - give it another crack." })
  } catch (err) {
    console.error('chat handler error', err)
    res.status(502).json({ error: 'Could not reach the AI service. Try again in a bit.' })
  }
}
