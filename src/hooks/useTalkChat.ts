import { useCallback, useState } from 'react'
import { sendChatMessage, type ChatMessage } from '../api/chat'
import type { RollupData } from './useRollupData'

const WELCOME: ChatMessage = {
  role: 'assistant',
  text: 'Hei! Spør meg om progresjonen din, dagens økt, eller hvordan uken har vært.',
}

export function useTalkChat(data: RollupData | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || sending) return
      setError(null)
      const history = messages
      setMessages((m) => [...m, { role: 'user', text: trimmed }])
      setSending(true)
      try {
        const reply = await sendChatMessage(trimmed, history, data)
        setMessages((m) => [...m, { role: 'assistant', text: reply }])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Noe gikk galt')
      } finally {
        setSending(false)
      }
    },
    [messages, sending, data],
  )

  return { messages, sending, error, sendMessage }
}

export type TalkChat = ReturnType<typeof useTalkChat>
