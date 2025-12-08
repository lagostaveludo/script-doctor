'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Document {
  id: string
  filename: string
  content: string
}

interface Chapter {
  id: string
  name: string
  status: string
  order_index: number
}

interface Part {
  id: string
  name: string
  status: string
  order_index: number
  chapters: Chapter[]
}

interface Project {
  id: string
  name: string
  description?: string
  project_documents: Document[]
  parts: Part[]
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [showAddPart, setShowAddPart] = useState(false)
  const [addChapterPartId, setAddChapterPartId] = useState<string | null>(null)
  const [newDocName, setNewDocName] = useState('')
  const [newDocContent, setNewDocContent] = useState('')
  const [newPartName, setNewPartName] = useState('')
  const [newChapterName, setNewChapterName] = useState('')

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`)
    const data = await res.json()
    setProject(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  async function addDocument() {
    if (!newDocName.trim() || !newDocContent.trim()) return

    await fetch(`/api/projects/${projectId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: newDocName, content: newDocContent })
    })

    setNewDocName('')
    setNewDocContent('')
    setShowAddDoc(false)
    fetchProject()
  }

  async function deleteDocument(docId: string) {
    await fetch(`/api/projects/${projectId}/documents?docId=${docId}`, {
      method: 'DELETE'
    })
    fetchProject()
  }

  async function addPart() {
    if (!newPartName.trim()) return

    await fetch(`/api/projects/${projectId}/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPartName })
    })

    setNewPartName('')
    setShowAddPart(false)
    fetchProject()
  }

  async function addChapter(partId: string) {
    if (!newChapterName.trim()) return

    await fetch(`/api/parts/${partId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChapterName })
    })

    setNewChapterName('')
    setAddChapterPartId(null)
    fetchProject()
  }

  async function deletePart(part: Part) {
    const hasChapters = part.chapters && part.chapters.length > 0

    if (hasChapters) {
      if (!confirm(`A parte "${part.name}" tem ${part.chapters.length} capítulo(s). Deseja deletar tudo?`)) {
        return
      }
    }

    await fetch(`/api/parts/${part.id}`, { method: 'DELETE' })
    fetchProject()
  }

  async function deleteChapter(chapter: Chapter, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Deletar o capítulo "${chapter.name}"?`)) {
      return
    }

    await fetch(`/api/chapters/${chapter.id}`, { method: 'DELETE' })
    fetchProject()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setNewDocContent(event.target?.result as string)
      setNewDocName(file.name)
    }
    reader.readAsText(file)
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-600',
    in_progress: 'bg-yellow-600',
    review: 'bg-blue-600',
    done: 'bg-green-600'
  }

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    in_progress: 'Em progresso',
    review: 'Revisão',
    done: 'Concluído'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-gray-400">Carregando...</p>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-red-400">Projeto não encontrado</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Voltar
        </Link>

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
          {project.description && (
            <p className="text-gray-400">{project.description}</p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documents Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Documentos</h2>
                <button
                  onClick={() => setShowAddDoc(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Adicionar
                </button>
              </div>

              {showAddDoc && (
                <div className="mb-4 p-4 bg-gray-700 rounded">
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="mb-3 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nome do arquivo"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-gray-600 p-2 rounded mb-2 text-sm"
                  />
                  <textarea
                    placeholder="Conteúdo"
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    className="w-full bg-gray-600 p-2 rounded mb-2 text-sm h-32"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={addDocument}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => {
                        setShowAddDoc(false)
                        setNewDocName('')
                        setNewDocContent('')
                      }}
                      className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {project.project_documents?.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum documento ainda</p>
              ) : (
                <ul className="space-y-2">
                  {project.project_documents?.map((doc) => (
                    <li key={doc.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <span className="text-sm truncate">{doc.filename}</span>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Parts & Chapters Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Estrutura</h2>
                <button
                  onClick={() => setShowAddPart(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  + Nova Parte
                </button>
              </div>

              {showAddPart && (
                <div className="mb-4 p-4 bg-gray-700 rounded flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome da parte"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    className="flex-1 bg-gray-600 p-2 rounded text-sm"
                    autoFocus
                  />
                  <button
                    onClick={addPart}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddPart(false)
                      setNewPartName('')
                    }}
                    className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {project.parts?.length === 0 ? (
                <p className="text-gray-500">Nenhuma parte criada ainda</p>
              ) : (
                <div className="space-y-4">
                  {project.parts
                    ?.sort((a, b) => a.order_index - b.order_index)
                    .map((part, partIndex) => (
                    <div key={part.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium">
                            Parte {partIndex + 1}: {part.name}
                          </h3>
                          <span className={`${statusColors[part.status]} px-2 py-0.5 rounded text-xs`}>
                            {statusLabels[part.status]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setAddChapterPartId(part.id)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            + Capítulo
                          </button>
                          <button
                            onClick={() => deletePart(part)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Deletar parte"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {addChapterPartId === part.id && (
                        <div className="mb-3 p-3 bg-gray-600 rounded flex gap-2">
                          <input
                            type="text"
                            placeholder="Nome do capítulo"
                            value={newChapterName}
                            onChange={(e) => setNewChapterName(e.target.value)}
                            className="flex-1 bg-gray-500 p-2 rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => addChapter(part.id)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                          >
                            Criar
                          </button>
                          <button
                            onClick={() => {
                              setAddChapterPartId(null)
                              setNewChapterName('')
                            }}
                            className="bg-gray-500 hover:bg-gray-400 px-3 py-1 rounded text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}

                      {part.chapters?.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum capítulo</p>
                      ) : (
                        <ul className="space-y-2">
                          {part.chapters
                            ?.sort((a, b) => a.order_index - b.order_index)
                            .map((chapter, chapterIndex) => (
                            <li key={chapter.id}>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/chapter/${chapter.id}`}
                                  className="flex-1 flex items-center justify-between p-3 bg-gray-600 rounded hover:bg-gray-550 transition"
                                >
                                  <span>
                                    Capítulo {chapterIndex + 1}: {chapter.name}
                                  </span>
                                  <span className={`${statusColors[chapter.status]} px-2 py-0.5 rounded text-xs`}>
                                    {statusLabels[chapter.status]}
                                  </span>
                                </Link>
                                <button
                                  onClick={(e) => deleteChapter(chapter, e)}
                                  className="text-red-400 hover:text-red-300 p-2"
                                  title="Deletar capítulo"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
