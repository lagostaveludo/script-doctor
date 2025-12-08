import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DEFAULT_PROMPT_TEMPLATE } from '@/lib/openai'

export async function GET() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'default')
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return defaults if no settings exist
  if (!data) {
    return NextResponse.json({
      id: 'default',
      prompt_template: DEFAULT_PROMPT_TEMPLATE,
      tts_voice: 'pm_alex',
    })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { prompt_template, tts_voice } = body

  // Upsert settings
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: 'default',
      prompt_template: prompt_template || DEFAULT_PROMPT_TEMPLATE,
      tts_voice: tts_voice || 'pm_alex',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
