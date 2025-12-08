import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface ProjectDocument {
  id: string
  project_id: string
  filename: string
  content: string
  created_at: string
}

export interface Part {
  id: string
  project_id: string
  name: string
  order_index: number
  status: 'draft' | 'in_progress' | 'review' | 'done'
  created_at: string
}

export interface Chapter {
  id: string
  part_id: string
  name: string
  order_index: number
  status: 'draft' | 'in_progress' | 'review' | 'done'
  created_at: string
}

export interface ChapterDocument {
  id: string
  chapter_id: string
  filename: string
  content: string
  created_at: string
}

export interface Paragraph {
  id: string
  chapter_id: string
  content: string
  audio_url?: string
  order_index: number
  approved_at?: string
  created_at: string
}
