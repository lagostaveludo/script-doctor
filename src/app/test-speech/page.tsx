'use client'

import { useState, useRef, useEffect } from 'react'

export default function TestSpeechPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [audioLevel, setAudioLevel] = useState(0)
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[TestSpeech] ${message}`)
  }

  useEffect(() => {
    // Check browser support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setSpeechSupported(true)
      log('SpeechRecognition API disponivel')
    } else {
      setSpeechSupported(false)
      log('ERRO: SpeechRecognition NAO disponivel neste navegador')
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startAudioVisualization = async () => {
    try {
      log('Solicitando acesso ao microfone...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      log('Microfone autorizado')

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
        }
        animationRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
      log('Visualizacao de audio iniciada')
    } catch (err) {
      log(`ERRO ao acessar microfone: ${err}`)
    }
  }

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAudioLevel(0)
    log('Visualizacao de audio parada')
  }

  const startRecording = () => {
    log('=== INICIANDO GRAVACAO ===')

    // Muda o estado IMEDIATAMENTE para o usuario ver feedback
    setIsRecording(true)
    log('Estado mudado para isRecording=true')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      log('ERRO: SpeechRecognition nao disponivel')
      setIsRecording(false)
      return
    }

    log('Criando instancia de SpeechRecognition...')
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    log('Instancia criada')

    // Configuracao
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    log(`Configurado: lang=${recognition.lang}, continuous=${recognition.continuous}, interimResults=${recognition.interimResults}`)

    // Event handlers
    recognition.onstart = () => {
      log('EVENT: onstart - Reconhecimento iniciado pelo browser')
    }

    recognition.onaudiostart = () => {
      log('EVENT: onaudiostart - Audio capturado')
    }

    recognition.onsoundstart = () => {
      log('EVENT: onsoundstart - Som detectado')
    }

    recognition.onspeechstart = () => {
      log('EVENT: onspeechstart - Fala detectada')
    }

    recognition.onspeechend = () => {
      log('EVENT: onspeechend - Fala terminou')
    }

    recognition.onsoundend = () => {
      log('EVENT: onsoundend - Som terminou')
    }

    recognition.onaudioend = () => {
      log('EVENT: onaudioend - Audio terminou')
    }

    recognition.onend = () => {
      log('EVENT: onend - Reconhecimento terminou')
      setIsRecording(false)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      log(`EVENT: onresult - ${event.results.length} resultado(s)`)

      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const confidence = result[0].confidence

        if (result.isFinal) {
          finalTranscript += text
          log(`FINAL: "${text}" (confianca: ${(confidence * 100).toFixed(1)}%)`)
        } else {
          interimTranscript += text
          log(`INTERIM: "${text}"`)
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + ' ' + finalTranscript)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      log(`EVENT: onerror - Tipo: ${event.error}, Mensagem: ${event.message || 'N/A'}`)
    }

    recognition.onnomatch = () => {
      log('EVENT: onnomatch - Nenhuma correspondencia encontrada')
    }

    // Iniciar
    try {
      recognition.start()
      log('recognition.start() chamado')
      startAudioVisualization()
    } catch (err) {
      log(`ERRO ao iniciar: ${err}`)
    }
  }

  const stopRecording = () => {
    log('=== PARANDO GRAVACAO ===')

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        log('recognition.stop() chamado')
      } catch (err) {
        log(`ERRO ao parar: ${err}`)
      }
    }

    stopAudioVisualization()
    setIsRecording(false)
  }

  const clearLogs = () => {
    setLogs([])
    setTranscript('')
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Teste de Speech Recognition</h1>

      <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        <strong>Status:</strong> {
          speechSupported === null ? 'Verificando...' :
          speechSupported ? 'API Suportada' : 'API NAO Suportada'
        }
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={{
            padding: '20px 40px',
            fontSize: '18px',
            backgroundColor: isRecording ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {isRecording ? 'PARAR' : 'GRAVAR'}
        </button>

        <button
          onClick={clearLogs}
          style={{
            padding: '20px 40px',
            fontSize: '18px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          LIMPAR
        </button>
      </div>

      {/* Audio Level Bar */}
      <div style={{ marginBottom: '20px' }}>
        <strong>Nivel de Audio:</strong>
        <div style={{
          width: '100%',
          height: '30px',
          background: '#ddd',
          borderRadius: '5px',
          overflow: 'hidden',
          marginTop: '5px'
        }}>
          <div style={{
            width: `${audioLevel * 100}%`,
            height: '100%',
            background: audioLevel > 0.5 ? '#4CAF50' : audioLevel > 0.2 ? '#FFC107' : '#2196F3',
            transition: 'width 0.05s'
          }} />
        </div>
      </div>

      {/* Transcript */}
      <div style={{ marginBottom: '20px' }}>
        <strong>Transcricao:</strong>
        <div style={{
          padding: '15px',
          background: '#e8f5e9',
          borderRadius: '5px',
          minHeight: '60px',
          marginTop: '5px',
          whiteSpace: 'pre-wrap'
        }}>
          {transcript || '(vazio)'}
        </div>
      </div>

      {/* Logs */}
      <div>
        <strong>Logs ({logs.length}):</strong>
        <div style={{
          padding: '10px',
          background: '#263238',
          color: '#b2ff59',
          borderRadius: '5px',
          height: '400px',
          overflow: 'auto',
          marginTop: '5px',
          fontSize: '12px'
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
        <p><strong>Navegador:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
        <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
      </div>
    </div>
  )
}
