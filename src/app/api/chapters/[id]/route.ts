import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Get chapter with its documents and paragraphs
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select(`
      *,
      chapter_documents (*),
      paragraphs (*)
    `)
    .eq('id', id)
    .single()

  if (chapterError) {
    return NextResponse.json({ error: chapterError.message }, { status: 500 })
  }

  // Get the part to access project_id
  const { data: part, error: partError } = await supabase
    .from('parts')
    .select('project_id')
    .eq('id', chapter.part_id)
    .single()

  if (partError) {
    return NextResponse.json({ error: partError.message }, { status: 500 })
  }

  // Get project documents for context
  const { data: projectDocs, error: docsError } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', part.project_id)

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 })
  }

  // Sort paragraphs by order_index
  if (chapter.paragraphs) {
    chapter.paragraphs.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
  }

  return NextResponse.json({
    ...chapter,
    project_id: part.project_id,
    project_documents: projectDocs
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('chapters')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
