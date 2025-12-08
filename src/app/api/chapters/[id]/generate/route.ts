import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateParagraphs, countTokensEstimate } from '@/lib/openai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { instruction } = body

  try {
    // Get chapter with all context
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select(`
        *,
        chapter_documents (*),
        paragraphs (*)
      `)
      .eq('id', id)
      .single()

    if (chapterError) throw chapterError

    // Get the part to access project_id
    const { data: part, error: partError } = await supabase
      .from('parts')
      .select('project_id')
      .eq('id', chapter.part_id)
      .single()

    if (partError) throw partError

    // Get project documents
    const { data: projectDocs, error: docsError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', part.project_id)

    if (docsError) throw docsError

    // Build system context from all documents
    const projectContext = projectDocs
      .map((doc: { filename: string; content: string }) => `--- ${doc.filename} ---\n${doc.content}`)
      .join('\n\n')

    const chapterContext = chapter.chapter_documents
      .map((doc: { filename: string; content: string }) => `--- ${doc.filename} ---\n${doc.content}`)
      .join('\n\n')

    const systemContext = `DOCUMENTOS DO PROJETO:\n${projectContext}\n\nDOCUMENTOS DO CAPÍTULO:\n${chapterContext}`

    // Get approved paragraphs content
    const approvedParagraphs = chapter.paragraphs
      .filter((p: { approved_at: string | null }) => p.approved_at)
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((p: { content: string }) => p.content)
      .join('\n\n')

    // Generate new paragraphs
    const paragraphs = await generateParagraphs(
      systemContext,
      approvedParagraphs,
      instruction
    )

    // Calculate token usage estimate
    const totalContext = systemContext + approvedParagraphs + instruction
    const tokenEstimate = countTokensEstimate(totalContext)

    return NextResponse.json({
      paragraphs,
      tokenEstimate,
      maxTokens: 128000 // GPT-4o context window
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
