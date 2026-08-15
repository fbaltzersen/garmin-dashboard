const ACCESS_KEY = import.meta.env.VITE_CHAT_ACCESS_KEY as string | undefined

export async function synthesizeSpeech(text: string): Promise<Blob> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ACCESS_KEY ? { 'X-Chat-Access-Key': ACCESS_KEY } : {}),
    },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Tale-forespørsel feilet (${res.status})`)
  }
  return res.blob()
}
