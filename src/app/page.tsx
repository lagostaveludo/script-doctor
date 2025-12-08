'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data)
    setLoading(false)
  }

  async function createProject() {
    if (!newName.trim()) return

    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, description: newDesc })
    })

    setNewName('')
    setNewDesc('')
    setShowCreate(false)
    fetchProjects()
  }

  async function deleteProject(id: string) {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return

    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Script Doctor</h1>
            <p className="text-gray-400">Seu assistente de escrita com IA</p>
          </div>
          <Link
            href="/admin"
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </Link>
        </header>

        <div className="mb-6">
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-lg font-medium transition"
            >
              + Novo Projeto
            </button>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Criar Projeto</h2>
              <input
                type="text"
                placeholder="Nome do projeto"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-gray-700 p-3 rounded mb-3 text-white"
                autoFocus
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-gray-700 p-3 rounded mb-4 text-white h-24"
              />
              <div className="flex gap-3">
                <button
                  onClick={createProject}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium transition"
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400">Nenhum projeto ainda. Crie um para começar!</p>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 p-6 rounded-lg flex justify-between items-center hover:bg-gray-750 transition"
              >
                <Link href={`/project/${project.id}`} className="flex-1">
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  {project.description && (
                    <p className="text-gray-400 mt-1">{project.description}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </Link>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="text-red-400 hover:text-red-300 ml-4 p-2"
                  title="Deletar projeto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
