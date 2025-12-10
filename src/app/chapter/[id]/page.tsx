'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const VERSION = '0.7.0'
const MAX_CONTEXT_TOKENS = 128000 // GPT-4o limit

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

// Token estimation (~3 chars per token for Portuguese)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3)
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  badge,
  defaultOpen = false,
  children,
  actions
}: {
  title: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="mb-4 bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-750"
      >
        <div className="flex items-center gap-2">
          <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
          <span className="font-medium">{title}</span>
          {badge !== undefined && (
            <span className="bg-gray-600 text-xs px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {actions && <div onClick={e => e.stopPropagation()}>{actions}</div>}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </section>
  )
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
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingStatus, setRecordingStatus] = useState<string>('')

  // Action mode for pending paragraphs
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'none'>('none')

  // Pending paragraphs and explanation
  const [pendingParagraphs, setPendingParagraphs] = useState<string[]>([])
  const [aiExplanation, setAiExplanation] = useState<string>('')

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | number | null>(null)
  const [ttsVoice, setTtsVoice] = useState('pm_alex')
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Document upload state
  const [uploading, setUploading] = useState(false)

  // Expanded paragraphs (for approved content)
  const [expandedParagraphs, setExpandedParagraphs] = useState<Set<string>>(new Set())

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const stopPlaybackRef = useRef(false)

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
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setTtsVoice(data.tts_voice || 'pm_alex'))
      .catch(console.error)
  }, [fetchChapter])

  useEffect(() => {
    return () => {
      stopAudioMonitoring()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // Recording functions
  async function startRecording() {
    // Stop any playing TTS
    stopSpeaking()

    try {
      setRecordingStatus('Solicitando microfone...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        await transcribeAudio()
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingStatus('Gravando...')

      // Audio visualization
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
      setRecordingStatus('Erro ao acessar microfone')
      setIsRecording(false)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    stopAudioMonitoring()
    setRecordingStatus('Processando...')
  }

  async function transcribeAudio() {
    if (audioChunksRef.current.length === 0) {
      setRecordingStatus('Nenhum audio gravado')
      return
    }

    setIsTranscribing(true)
    setRecordingStatus('Transcrevendo com Whisper...')

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.error) {
        setRecordingStatus('Erro: ' + data.error)
        return
      }

      if (data.text) {
        setInstruction(prev => (prev ? prev + ' ' + data.text : data.text).trim())
        setRecordingStatus('Transcricao concluida!')
        setTimeout(() => setRecordingStatus(''), 2000)
      } else {
        setRecordingStatus('Nenhum texto detectado')
      }
    } catch (err) {
      console.error('Transcription failed:', err)
      setRecordingStatus('Erro na transcricao')
    } finally {
      setIsTranscribing(false)
      audioChunksRef.current = []
    }
  }

  function stopAudioMonitoring() {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    if (audioContextRef.current) audioContextRef.current.close()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    animationRef.current = null
    audioContextRef.current = null
    streamRef.current = null
    setAudioLevel(0)
  }

  // TTS functions
  async function speakText(text: string, id: string | number) {
    try {
      setSpeakingId(id)
      setIsSpeaking(true)

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: ttsVoice })
      })

      if (!res.ok) throw new Error('TTS failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.playbackRate = playbackSpeed
      audioRef.current = audio

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('TTS error:', err)
    } finally {
      if (speakingId === id) {
        setSpeakingId(null)
        setIsSpeaking(false)
      }
    }
  }

  async function speakAllApproved() {
    const paragraphs = chapter?.paragraphs?.filter(p => p.approved_at) || []
    if (paragraphs.length === 0) return

    setIsSpeaking(true)
    stopPlaybackRef.current = false

    for (const p of paragraphs) {
      if (stopPlaybackRef.current) break
      await speakText(p.content, p.id)
    }

    setIsSpeaking(false)
    setSpeakingId(null)
  }

  async function speakAllPending() {
    if (pendingParagraphs.length === 0) return

    setIsSpeaking(true)
    stopPlaybackRef.current = false

    for (let i = 0; i < pendingParagraphs.length; i++) {
      if (stopPlaybackRef.current) break
      await speakText(pendingParagraphs[i], `pending-${i}`)
    }

    setIsSpeaking(false)
    setSpeakingId(null)
  }

  function stopSpeaking() {
    stopPlaybackRef.current = true
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
    setSpeakingId(null)
  }

  // Generation with action
  async function handleGenerate() {
    // First, handle pending paragraphs based on selected action
    if (pendingParagraphs.length > 0) {
      if (pendingAction === 'approve') {
        await fetch(`/api/chapters/${chapterId}/paragraphs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paragraphs: pendingParagraphs })
        })
        fetchChapter()
      }
      // For 'reject' or 'none', we just clear them (reject) or keep generating
      setPendingParagraphs([])
    }

    const text = instruction.trim() || 'Continue a narrativa com os proximos 4 paragrafos.'
    setGenerating(true)

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
      setAiExplanation(data.explanation || '')
      setInstruction('')
      setPendingAction('none') // Reset action for next round

      // Auto-play generated paragraphs
      setTimeout(() => speakAllPending(), 100)
    } catch (err) {
      console.error('Generation failed:', err)
      alert('Erro ao gerar paragrafos')
    } finally {
      setGenerating(false)
    }
  }

  // Approve/Reject
  async function approveParagraph(index: number, withComment = false) {
    const text = pendingParagraphs[index]

    await fetch(`/api/chapters/${chapterId}/paragraphs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paragraphs: [text] })
    })

    setPendingParagraphs(prev => prev.filter((_, i) => i !== index))
    fetchChapter()

    if (withComment) {
      setTimeout(() => startRecording(), 300)
    }
  }

  async function rejectParagraph(index: number, withComment = false) {
    setPendingParagraphs(prev => prev.filter((_, i) => i !== index))

    if (withComment) {
      setTimeout(() => startRecording(), 300)
    }
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

  async function deleteParagraph(id: string) {
    await fetch(`/api/chapters/${chapterId}/paragraphs?paragraphId=${id}`, { method: 'DELETE' })
    fetchChapter()
  }

  // Document handling
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      alert('Apenas arquivos .txt ou .md')
      return
    }

    setUploading(true)
    try {
      const content = await file.text()
      const res = await fetch(`/api/chapters/${chapterId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content })
      })
      if (!res.ok) throw new Error('Upload failed')
      fetchChapter()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Erro ao fazer upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function deleteDocument(docId: string) {
    await fetch(`/api/chapters/${chapterId}/documents?documentId=${docId}`, { method: 'DELETE' })
    fetchChapter()
  }

  // Toggle paragraph expansion
  function toggleParagraph(id: string) {
    setExpandedParagraphs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  // Derived data
  const approvedParagraphs = chapter?.paragraphs?.filter(p => p.approved_at) || []
  const projectDocs = chapter?.project_documents || []
  const chapterDocs = chapter?.chapter_documents || []

  const approvedText = approvedParagraphs.map(p => p.content).join('\n')
  const docsText = [...projectDocs, ...chapterDocs].map(d => d.content).join('\n')
  const totalContextTokens = estimateTokens(approvedText + docsText)
  const contextPercentage = Math.min((totalContextTokens / MAX_CONTEXT_TOKENS) * 100, 100)

  // Loading
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
        <p className="text-red-400">Capitulo nao encontrado</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <header className="bg-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <Link href={`/project/${chapter.project_id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                ← Voltar ao projeto
              </Link>
              <h1 className="text-xl font-bold mt-1">{chapter.name}</h1>
            </div>
            {/* Speed control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Velocidade:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="bg-gray-700 text-sm rounded px-2 py-1"
              >
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* Context bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Contexto utilizado</span>
              <span>{totalContextTokens.toLocaleString()} / {MAX_CONTEXT_TOKENS.toLocaleString()} tokens ({contextPercentage.toFixed(0)}%)</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  contextPercentage > 80 ? 'bg-red-500' : contextPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${contextPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Section: Contexto (Documents) */}
        <CollapsibleSection
          title="Contexto"
          badge={projectDocs.length + chapterDocs.length}
          defaultOpen={false}
        >
          {/* Project docs */}
          {projectDocs.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm text-gray-400 mb-2">Documentos do Projeto:</h3>
              <div className="space-y-2">
                {projectDocs.map(doc => (
                  <div key={doc.id} className="bg-gray-700 p-2 rounded flex items-center justify-between">
                    <span className="text-sm truncate">{doc.filename}</span>
                    <span className="text-xs text-gray-400">~{estimateTokens(doc.content).toLocaleString()} tokens</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter docs */}
          <div className="mb-4">
            <h3 className="text-sm text-gray-400 mb-2">Documentos do Capitulo:</h3>
            {chapterDocs.length > 0 ? (
              <div className="space-y-2">
                {chapterDocs.map(doc => (
                  <div key={doc.id} className="bg-gray-700 p-2 rounded flex items-center justify-between">
                    <span className="text-sm truncate">{doc.filename}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">~{estimateTokens(doc.content).toLocaleString()} tokens</span>
                      <button onClick={() => deleteDocument(doc.id)} className="text-red-400 hover:text-red-300">×</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhum documento</p>
            )}
          </div>

          {/* Upload */}
          <input ref={fileInputRef} type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" id="doc-upload" />
          <label htmlFor="doc-upload" className={`block w-full text-center py-2 rounded-lg cursor-pointer ${uploading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {uploading ? 'Enviando...' : '+ Adicionar documento (.txt/.md)'}
          </label>
        </CollapsibleSection>

        {/* Section: Conteudo Aprovado */}
        {approvedParagraphs.length > 0 && (
          <CollapsibleSection
            title="Conteudo Aprovado"
            badge={approvedParagraphs.length}
            defaultOpen={true}
            actions={
              <div className="flex items-center gap-2">
                {isSpeaking && speakingId && String(speakingId).startsWith('pending') === false ? (
                  <button onClick={stopSpeaking} className="text-red-400 text-sm px-2">⏹ Parar</button>
                ) : (
                  <button onClick={speakAllApproved} className="text-blue-400 text-sm px-2">▶ Ouvir todos</button>
                )}
              </div>
            }
          >
            <div className="space-y-2">
              {approvedParagraphs.map((p, idx) => {
                const isExpanded = expandedParagraphs.has(p.id)
                const preview = p.content.slice(0, 80) + (p.content.length > 80 ? '...' : '')
                const isPlaying = speakingId === p.id

                return (
                  <div key={p.id} className={`bg-gray-700 rounded-lg overflow-hidden ${isPlaying ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="p-3 flex items-start gap-2">
                      <button
                        onClick={() => speakText(p.content, p.id)}
                        className="text-blue-400 hover:text-blue-300 mt-1"
                        title="Ouvir"
                      >
                        {isPlaying ? '🔊' : '▶'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => toggleParagraph(p.id)}
                          className="text-left w-full"
                        >
                          <span className="text-xs text-gray-400">#{idx + 1}</span>
                          <p className="text-gray-100 text-sm">
                            {isExpanded ? p.content : preview}
                          </p>
                        </button>
                      </div>
                      <button
                        onClick={() => deleteParagraph(p.id)}
                        className="text-red-400 hover:text-red-300 opacity-50 hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Section: Revisao (pending paragraphs) */}
        {pendingParagraphs.length > 0 && (
          <CollapsibleSection
            title="Revisar Paragrafos"
            badge={pendingParagraphs.length}
            defaultOpen={true}
            actions={
              isSpeaking && String(speakingId).startsWith('pending') ? (
                <button onClick={stopSpeaking} className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1 rounded-lg">⏹ Parar</button>
              ) : (
                <button onClick={speakAllPending} className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded-lg">▶ Ouvir todos</button>
              )
            }
          >
            {/* AI Explanation */}
            {aiExplanation && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-xs text-blue-400 mb-1">💡 Raciocínio da IA:</p>
                <p className="text-sm text-blue-100">{aiExplanation}</p>
              </div>
            )}

            <div className="space-y-3">
              {pendingParagraphs.map((text, idx) => {
                const isPlaying = speakingId === `pending-${idx}`

                return (
                  <div key={idx} className={`bg-gray-700 rounded-lg p-3 ${isPlaying ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => speakText(text, `pending-${idx}`)}
                          className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-sm"
                          title="Ouvir"
                        >
                          {isPlaying ? '🔊' : '▶'}
                        </button>
                        <button
                          onClick={() => approveParagraph(idx)}
                          className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs"
                          title="Aprovar este"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => rejectParagraph(idx)}
                          className="bg-red-700 hover:bg-red-600 px-2 py-1 rounded text-xs"
                          title="Rejeitar este"
                        >
                          ✗
                        </button>
                      </div>
                      <p className="text-gray-100 leading-relaxed flex-1 text-sm">{text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Section: Criar */}
        <CollapsibleSection title="Criar" defaultOpen={true}>
          {/* Recording status */}
          {(isRecording || isTranscribing) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isRecording ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <span className={`text-sm ${isRecording ? 'text-red-400' : 'text-yellow-400'}`}>
                  {recordingStatus}
                </span>
              </div>
              {isRecording && (
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                    style={{ width: `${Math.min(audioLevel * 200, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Success message */}
          {!isRecording && !isTranscribing && recordingStatus && (
            <p className="text-sm text-green-400 mb-4">{recordingStatus}</p>
          )}

          {/* Text input - always visible, single field */}
          <div className="mb-4">
            <div className="relative">
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Instrucoes para os proximos paragrafos..."
                className="w-full bg-gray-700 p-3 rounded-lg text-white min-h-[80px] pr-10 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              {instruction && (
                <button
                  onClick={() => setInstruction('')}
                  className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm"
                  title="Limpar"
                >
                  ✕ Limpar
                </button>
              )}
            </div>
          </div>

          {/* Action selector - only shows when there are pending paragraphs */}
          {pendingParagraphs.length > 0 && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Ao gerar, o que fazer com os {pendingParagraphs.length} paragrafos pendentes?</p>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 p-2 rounded cursor-pointer ${pendingAction === 'approve' ? 'bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                  <input
                    type="radio"
                    name="pendingAction"
                    checked={pendingAction === 'approve'}
                    onChange={() => setPendingAction('approve')}
                    className="hidden"
                  />
                  <span className="text-green-400">✓</span>
                  <span>Aprovar todos e gerar proximos</span>
                </label>
                <label className={`flex items-center gap-2 p-2 rounded cursor-pointer ${pendingAction === 'reject' ? 'bg-red-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
                  <input
                    type="radio"
                    name="pendingAction"
                    checked={pendingAction === 'reject'}
                    onChange={() => setPendingAction('reject')}
                    className="hidden"
                  />
                  <span className="text-red-400">✗</span>
                  <span>Reprovar todos e gerar novos</span>
                </label>
              </div>
            </div>
          )}

          {/* Main buttons */}
          <div className="space-y-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={generating || isTranscribing}
              className={`w-full py-5 rounded-xl text-xl font-bold flex items-center justify-center gap-3 ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : isTranscribing ? 'bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:bg-gray-600`}
            >
              {isRecording ? '⏹ PARAR GRAVACAO' : isTranscribing ? '⏳ TRANSCREVENDO...' : '🎤 GRAVAR'}
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating || isTranscribing || (pendingParagraphs.length > 0 && pendingAction === 'none')}
              className={`w-full py-5 rounded-xl text-xl font-bold ${
                generating ? 'bg-gray-600' :
                pendingParagraphs.length > 0 && pendingAction === 'none' ? 'bg-gray-600 cursor-not-allowed' :
                pendingAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                pendingAction === 'reject' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {generating ? '⏳ GERANDO...' :
               pendingParagraphs.length > 0 && pendingAction === 'none' ? '↑ Selecione uma acao acima' :
               pendingAction === 'approve' ? '✓ APROVAR E GERAR' :
               pendingAction === 'reject' ? '✗ REPROVAR E GERAR' :
               instruction.trim() ? '✨ GERAR' : '✨ GERAR (CONTINUAR)'}
            </button>
          </div>
        </CollapsibleSection>
      </div>

      {/* Version badge */}
      <div className="fixed bottom-4 left-4 bg-pink-600 text-white text-xs px-2 py-1 rounded">
        v{VERSION}
      </div>
    </main>
  )
}
