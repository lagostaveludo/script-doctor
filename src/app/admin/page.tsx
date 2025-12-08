'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const VOICES = {
  pm_alex: 'Alex (masculino)',
  pm_santa: 'Santa (masculino)',
  pf_dora: 'Dora (feminino)',
}

const PLACEHOLDERS = [
  { key: '{{PROJECT_CONTEXT}}', desc: 'Conteúdo dos documentos do projeto e capítulo' },
  { key: '{{CHAPTER_CONTENT}}', desc: 'Parágrafos já aprovados no capítulo' },
]

export default function AdminPage() {
  const [promptTemplate, setPromptTemplate] = useState('')
  const [ttsVoice, setTtsVoice] = useState('pm_alex')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const res = await fetch('/api/settings')
    const data = await res.json()
    setPromptTemplate(data.prompt_template || '')
    setTtsVoice(data.tts_voice || 'pm_alex')
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    setSaved(false)

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_template: promptTemplate,
        tts_voice: ttsVoice,
      }),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function resetToDefault() {
    if (!confirm('Resetar o template para o padrão?')) return

    const res = await fetch('/api/settings')
    const data = await res.json()

    // Fetch default from a fresh call that returns the hardcoded default
    const defaultRes = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt_template: null, // Will use default
        tts_voice: ttsVoice,
      }),
    })
    const defaultData = await defaultRes.json()
    setPromptTemplate(defaultData.prompt_template)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-gray-400">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Voltar
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Configurações</h1>
          <p className="text-gray-400">Ajuste o template de prompt e voz do TTS</p>
        </header>

        {/* TTS Voice */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Voz do TTS</h2>
          <p className="text-gray-400 text-sm mb-4">
            Voz usada para ler os parágrafos gerados (UnrealSpeech PT-BR)
          </p>
          <select
            value={ttsVoice}
            onChange={(e) => setTtsVoice(e.target.value)}
            className="bg-gray-700 p-3 rounded text-white w-full max-w-xs"
          >
            {Object.entries(VOICES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>

        {/* Prompt Template */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold">Template de Prompt</h2>
              <p className="text-gray-400 text-sm mt-1">
                Prompt enviado para a IA ao gerar parágrafos
              </p>
            </div>
            <button
              onClick={resetToDefault}
              className="text-gray-400 hover:text-white text-sm"
            >
              Resetar padrão
            </button>
          </div>

          {/* Placeholders info */}
          <div className="bg-gray-700 rounded p-4 mb-4">
            <h3 className="text-sm font-medium mb-2">Placeholders disponíveis:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {PLACEHOLDERS.map((p) => (
                <li key={p.key}>
                  <code className="bg-gray-600 px-1 rounded">{p.key}</code>
                  <span className="text-gray-400 ml-2">→ {p.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="w-full bg-gray-700 p-4 rounded text-white font-mono text-sm h-96"
            placeholder="Template do prompt..."
          />
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-8 py-3 rounded-lg font-medium transition"
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>

          {saved && (
            <span className="text-green-400">Salvo com sucesso!</span>
          )}
        </div>
      </div>
    </main>
  )
}
