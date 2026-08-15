import { useCallback, useRef, useState } from 'react'
import { synthesizeSpeech } from '../api/tts'

/** Caches one object URL per message index so revisiting a reply (or the
 * Talk tab) doesn't re-bill ElevenLabs for the same text. Keyed by index
 * since messages are only ever appended, never reordered/removed. */
export function useSpeech() {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const cacheRef = useRef<Map<number, string>>(new Map())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlayingIndex(null)
  }, [])

  const play = useCallback(
    async (index: number, text: string) => {
      if (playingIndex === index) {
        stop()
        return
      }
      stop()
      setError(null)

      let url = cacheRef.current.get(index)
      if (!url) {
        setLoadingIndex(index)
        try {
          const blob = await synthesizeSpeech(text)
          url = URL.createObjectURL(blob)
          cacheRef.current.set(index, url)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Kunne ikke spille av lyd')
          setLoadingIndex(null)
          return
        }
        setLoadingIndex(null)
      }

      const audio = new Audio(url)
      audio.onended = () => setPlayingIndex(null)
      audioRef.current = audio
      setPlayingIndex(index)
      void audio.play()
    },
    [playingIndex, stop],
  )

  return { play, stop, playingIndex, loadingIndex, error }
}

export type Speech = ReturnType<typeof useSpeech>
