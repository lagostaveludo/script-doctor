'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const VERSION = '0.2.0'

interface Paragraph {
  id: string
  content: string
  order_index: number
  approved_at?: string
}

interface Document {
  id: string
  filename: string
  content: string
}

interface Chapter {
  id: string
  name: string
  status: string
  part_id: string
  project_id: string
  paragraphs: Paragraph[]
  chapter_documents: Document[]
  project_documents: Document[]
}

export default function ChapterPage() {
  const params = useParams()
  const chapterId = params.id as string

  // Core state
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Input state
  const [instruction, setInstruction] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [speechStatus, setSpeechStatus] = useState<string>('')

  // Pending paragraphs (generated but not yet approved)
  const [pendingParagraphs, setPendingParagraphs] = useState<string[]>([])

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(-1)
  const [ttsVoice, setTtsVoice] = useState('pm_alex')

  // Refs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Fetch chapter data
  const fetchChapter = useCallback(async () => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}`)
      const data = await res.json()
      setChapter(data)
    } catch (err) {
      console.error('Failed to fetch chapter:', err)
    } finally {
      setLoading(false)
    }
  }, [chapterId])

  useEffect(() => {
    fetchChapter()

    // Fetch TTS voice setting
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setTtsVoice(data.tts_voice || 'pm_alex'))
      .catch(console.error)
  }, [fetchChapter])

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechStatus('Navegador não suporta reconhecimento de voz')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'pt-BR'

    recognition.onstart = () => {
      setSpeechStatus('Ouvindo...')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (final) {
        setInstruction(prev => (prev ? prev + ' ' + final : final).trim())
        setInterimText('')
        setSpeechStatus('Texto capturado!')
      } else {
        setInterimText(interim)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error)
      const messages: Record<string, string> = {
        'no-speech': 'Nenhuma fala detectada',
        'audio-capture': 'Microfone não encontrado',
        'not-allowed': 'Permissão negada',
        'network': 'Erro de rede',
      }
      setSpeechStatus(messages[event.error] || `Erro: ${event.error}`)
      setIsRecording(false)
      stopAudioMonitoring()
    }

    recognition.onend = () => {
      if (isRecording) {
        // Auto-restart if still should be recording
        try {
          recognition.start()
        } catch (e) {
          setIsRecording(false)
          stopAudioMonitoring()
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [isRecording])

  // Start recording
  async function startRecording() {
    if (!recognitionRef.current) {
      setSpeechStatus('Reconhecimento não disponível')
      return
    }

    try {
      // Start speech recognition
      recognitionRef.current.start()
      setIsRecording(true)
      setSpeechStatus('Iniciando...')

      // Start audio level monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      function updateLevel() {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          setAudioLevel(avg / 255)
        }
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

    } catch (err) {
      console.error('Failed to start recording:', err)
      setSpeechStatus('Falha ao iniciar gravação')
      setIsRecording(false)
    }
  }

  // Stop recording
  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    stopAudioMonitoring()
    setSpeechStatus('')
  }

  function stopAudioMonitoring() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setAudioLevel(0)
  }

  // Generate paragraphs
  async function handleGenerate() {
    const text = instruction.trim() || 'Continue a narrativa com os próximos 4 parágrafos.'

    setGenerating(true)
    setPendingParagraphs([])

    try {
      const res = await fetch(`/api/chapters/${chapterId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: text })
      })

      const data = await res.json()

      if (data.error) {
        alert('Erro: ' + data.error)
        return
      }

      setPendingParagraphs(data.paragraphs)
      setInstruction('')

      // Auto-read with TTS
      readParagraphs(data.paragraphs)
    } catch (err) {
      console.error('Generation failed:', err)
      alert('Erro ao gerar parágrafos')
    } finally {
      setGenerating(false)
    }
  }

  // TTS
  async function readParagraphs(paragraphs: string[]) {
    setIsSpeaking(true)

    for (let i = 0; i < paragraphs.length; i++) {
      setSpeakingIndex(i)

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: paragraphs[i], voice: ttsVoice })
        })

        if (!res.ok) continue

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve()
          audio.onerror = () => resolve()
          audio.play().catch(() => resolve())
        })

        URL.revokeObjectURL(url)
      } catch (err) {
        console.error('TTS error:', err)
      }
    }

    setIsSpeaking(false)
    setSpeakingIndex(-1)
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
    setSpeakingIndex(-1)
  }

  // Approve/Reject paragraphs
  async function approveParagraph(index: number) {
    const text = pendingParagraphs[index]

    await fetch(`/api/chapters/${chapterId}/paragraphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraphs: [text] })
    })

    setPendingParagraphs(prev => prev.filter((_, i) => i !== index))
    fetchChapter()
  }

  function rejectParagraph(index: number) {
    setPendingParagraphs(prev => prev.filter((_, i) => i !== index))
  }

  async function approveAll() {
    if (pendingParagraphs.length === 0) return

    await fetch(`/api/chapters/${chapterId}/paragraphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraphs: pendingParagraphs })
    })

    setPendingParagraphs([])
    fetchChapter()
  }

  function rejectAll() {
    setPendingParagraphs([])
  }

  // Delete approved paragraph
  async function deleteParagraph(id: string) {
    await fetch(`/api/chapters/${chapterId}/paragraphs?paragraphId=${id}`, {
      method: 'DELETE'
    })
    fetchChapter()
  }

  // Derived data
  const approvedParagraphs = chapter?.paragraphs?.filter(p => p.approved_at) || []

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </main>
    )
  }

  if (!chapter) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">Capítulo não encontrado</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <header className="bg-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <Link href={`/project/${chapter.project_id}`} className="text-blue-400 hover:text-blue-300 text-sm">
            ← Voltar ao projeto
          </Link>
          <h1 className="text-xl font-bold mt-1">{chapter.name}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Approved content */}
        {approvedParagraphs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm text-gray-400 mb-3">Conteúdo aprovado</h2>
            <div className="bg-gray-800 rounded-lg p-4 space-y-4">
              {approvedParagraphs.map((p) => (
                <div key={p.id} className="group relative">
                  <p className="text-gray-100 leading-relaxed pr-8">{p.content}</p>
                  <button
                    onClick={() => deleteParagraph(p.id)}
                    className="absolute top-0 right-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pending paragraphs - Review mode */}
        {pendingParagraphs.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm text-yellow-400">Revisar parágrafos</h2>
              {isSpeaking ? (
                <button onClick={stopSpeaking} className="text-red-400 text-sm">
                  ⏹ Parar
                </button>
              ) : (
                <button onClick={() => readParagraphs(pendingParagraphs)} className="text-blue-400 text-sm">
                  ▶ Ouvir todos
                </button>
              )}
            </div>

            <div className="space-y-4">
              {pendingParagraphs.map((text, idx) => (
                <div
                  key={idx}
                  className={`bg-gray-800 rounded-lg p-4 ${speakingIndex === idx ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <p className="text-gray-100 leading-relaxed mb-4">{text}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveParagraph(idx)}
                      className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => rejectParagraph(idx)}
                      className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-lg font-bold"
                    >
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Batch actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={approveAll}
                className="flex-1 bg-green-700 hover:bg-green-800 py-3 rounded-lg font-bold"
              >
                Aprovar todos
              </button>
              <button
                onClick={rejectAll}
                className="flex-1 bg-red-700 hover:bg-red-800 py-3 rounded-lg font-bold"
              >
                Reprovar todos
              </button>
            </div>

            {/* Regenerate section */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Refazer com instrução:</p>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Ex: mais diálogo, menos descrição..."
                className="w-full bg-gray-700 p-3 rounded-lg text-white mb-2 min-h-[60px]"
              />
              <div className="flex gap-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex-1 py-3 rounded-lg font-bold ${
                    isRecording ? 'bg-red-600' : 'bg-blue-600'
                  }`}
                >
                  {isRecording ? '⏹ Parar' : '🎤 Gravar'}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !instruction.trim()}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 py-3 rounded-lg font-bold"
                >
                  {generating ? '...' : '🔄 Refazer'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Input section - only when no pending paragraphs */}
        {pendingParagraphs.length === 0 && (
          <section className="bg-gray-800 rounded-lg p-4">
            {/* Text input */}
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Descreva o que a IA deve escrever..."
              className="w-full bg-gray-700 p-4 rounded-lg text-white mb-4 min-h-[100px]"
            />

            {/* Recording indicator */}
            {isRecording && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-400">{speechStatus || 'Gravando...'}</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                    style={{ width: `${Math.min(audioLevel * 200, 100)}%` }}
                  />
                </div>
                {interimText && (
                  <p className="mt-2 text-sm text-gray-400 italic">"{interimText}"</p>
                )}
              </div>
            )}

            {/* Status message */}
            {!isRecording && speechStatus && (
              <p className="text-sm text-yellow-400 mb-4">{speechStatus}</p>
            )}

            {/* Big buttons */}
            <div className="space-y-3">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={generating}
                className={`w-full py-5 rounded-xl text-xl font-bold flex items-center justify-center gap-3 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:bg-gray-600`}
              >
                {isRecording ? '⏹ PARAR GRAVAÇÃO' : '🎤 GRAVAR'}
              </button>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 py-5 rounded-xl text-xl font-bold flex items-center justify-center gap-3"
              >
                {generating ? '⏳ GERANDO...' : instruction.trim() ? '✨ GERAR' : '✨ GERAR (CONTINUAR)'}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Version badge - fixed bottom left */}
      <div className="fixed bottom-4 left-4 bg-pink-600 text-white text-xs px-2 py-1 rounded">
        v{VERSION}
      </div>
    </main>
  )
}

// TypeScript declarations
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any
  }
}
