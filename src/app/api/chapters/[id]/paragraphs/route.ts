import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { paragraphs } = body // Array of paragraph contents to approve

  // Get the next order index
  const { data: existingParagraphs } = await supabase
    .from('paragraphs')
    .select('order_index')
    .eq('chapter_id', id)
    .order('order_index', { ascending: false })
    .limit(1)

  let nextIndex = existingParagraphs && existingParagraphs.length > 0
    ? existingParagraphs[0].order_index + 1
    : 0

  // Insert all paragraphs
  const toInsert = paragraphs.map((content: string) => ({
    chapter_id: id,
    content,
    order_index: nextIndex++,
    approved_at: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('paragraphs')
    .insert(toInsert)
    .select()

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
  const { searchParams } = new URL(request.url)
  const paragraphId = searchParams.get('paragraphId')

  if (!paragraphId) {
    return NextResponse.json({ error: 'paragraphId required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('paragraphs')
    .delete()
    .eq('id', paragraphId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
