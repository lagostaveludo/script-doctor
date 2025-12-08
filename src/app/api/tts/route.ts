import { NextRequest, NextResponse } from 'next/server'

const UNREALSPEECH_API_KEY = process.env.UNREALSPEECH_API_KEY
const API_BASE = 'https://api.v8.unrealspeech.com'

// Available PT-BR voices
export const VOICES = {
  pm_alex: 'Alex (masculino)',
  pm_santa: 'Santa (masculino)',
  pf_dora: 'Dora (feminino)',
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { text, voice = 'pm_alex' } = body

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }

  if (!UNREALSPEECH_API_KEY) {
    return NextResponse.json({ error: 'TTS API key not configured' }, { status: 500 })
  }

  try {
    // For short texts (< 1000 chars), use stream endpoint for faster response
    if (text.length < 1000) {
      const response = await fetch(`${API_BASE}/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNREALSPEECH_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Text: text,
          VoiceId: voice,
          Bitrate: '192k',
          Speed: 0,
          Pitch: 1.0,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('UnrealSpeech error:', error)
        return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
      }

      // Return the audio stream
      const audioBuffer = await response.arrayBuffer()
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
        },
      })
    }

    // For longer texts, use synthesis task (async)
    const createResponse = await fetch(`${API_BASE}/synthesisTasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNREALSPEECH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: voice,
        Bitrate: '192k',
        Speed: 0,
        Pitch: 1.0,
        TimestampType: 'sentence',
      }),
    })

    if (!createResponse.ok) {
      const error = await createResponse.text()
      console.error('UnrealSpeech create task error:', error)
      return NextResponse.json({ error: 'TTS task creation failed' }, { status: 500 })
    }

    const taskData = await createResponse.json()
    const taskId = taskData.SynthesisTask.TaskId

    // Poll for completion (max 60 seconds)
    const maxAttempts = 30
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const statusResponse = await fetch(`${API_BASE}/synthesisTasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${UNREALSPEECH_API_KEY}`,
        },
      })

      const statusData = await statusResponse.json()
      const status = statusData.SynthesisTask.TaskStatus

      if (status === 'completed') {
        const audioUrl = statusData.SynthesisTask.OutputUri

        // Download and return audio
        const audioResponse = await fetch(audioUrl)
        const audioBuffer = await audioResponse.arrayBuffer()

        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
          },
        })
      } else if (status === 'failed') {
        return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'TTS generation timeout' }, { status: 504 })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return available voices
  return NextResponse.json({ voices: VOICES })
}
