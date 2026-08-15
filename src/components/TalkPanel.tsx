import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from 'lucide-react'
import type { TalkChat } from '../hooks/useTalkChat'
import type { Speech } from '../hooks/useSpeech'

interface MinimalSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => MinimalSpeechRecognition
    webkitSpeechRecognition?: new () => MinimalSpeechRecognition
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function TalkPanel({ chat, speech }: { chat: TalkChat; speech: Speech }) {
  const { messages, sending, error, sendMessage } = chat
  const [draft, setDraft] = useState('')
  const [listening, setListening] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null)

  const SpeechRecognitionCtor = useMemo(() => getSpeechRecognitionCtor(), [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  function handleSend() {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    void sendMessage(text)
  }

  function toggleListening() {
    if (!SpeechRecognitionCtor) return
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'nb-NO'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript
      if (transcript) setDraft((d) => (d ? `${d} ${transcript}` : transcript))
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  return (
    <div className="talk-panel">
      <div className="talk-header">
        <span className={`talk-status-dot ${sending ? 'active' : ''}`} />
        <Sparkles style={{ width: 15, height: 15, color: 'var(--series-blue)' }} />
        <span className="talk-header-title">TEMPO</span>
        <span className="talk-header-status">{sending ? 'Tenker…' : listening ? 'Lytter…' : 'Online'}</span>
      </div>
      <div className="talk-messages" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`talk-bubble-row ${m.role === 'user' ? 'user' : 'assistant'}`}>
            <div className={`talk-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <span className="talk-bubble-text">{m.text}</span>
              {m.role === 'assistant' && (
                <button
                  type="button"
                  className={`talk-listen-button ${speech.playingIndex === i ? 'active' : ''}`}
                  onClick={() => void speech.play(i, m.text)}
                  title={speech.playingIndex === i ? 'Stopp' : 'Lytt til svaret'}
                >
                  {speech.loadingIndex === i ? <Loader2 className="spin" /> : <Volume2 />}
                </button>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="talk-bubble-row assistant">
            <div className="talk-bubble assistant talk-bubble-pending">Tenker…</div>
          </div>
        )}
        {error && <p className="sync-status error" style={{ padding: '0 4px' }}>{error}</p>}
        {speech.error && <p className="sync-status error" style={{ padding: '0 4px' }}>{speech.error}</p>}
      </div>
      <div className="talk-input-bar">
        {SpeechRecognitionCtor && (
          <button
            type="button"
            className={`talk-mic-button ${listening ? 'listening' : ''}`}
            onClick={toggleListening}
            title={listening ? 'Stopp opptak' : 'Snakk med TEMPO'}
          >
            {listening ? <MicOff /> : <Mic />}
          </button>
        )}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
          placeholder="Spør TEMPO om noe..."
          className="talk-text-input"
        />
        <button type="button" className="button-primary" onClick={handleSend} disabled={sending || !draft.trim()}>
          <Send />
          Send
        </button>
      </div>
    </div>
  )
}
