import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('parts')
    .select(`
      *,
      chapters (*)
    `)
    .eq('project_id', id)
    .order('order_index', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name } = body

  // Get the next order index
  const { data: existingParts } = await supabase
    .from('parts')
    .select('order_index')
    .eq('project_id', id)
    .order('order_index', { ascending: false })
    .limit(1)

  const nextIndex = existingParts && existingParts.length > 0
    ? existingParts[0].order_index + 1
    : 0

  const { data, error } = await supabase
    .from('parts')
    .insert({ project_id: id, name, order_index: nextIndex })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
