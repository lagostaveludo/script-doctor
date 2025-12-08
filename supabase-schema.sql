-- Script Doctor Database Schema

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project documents (concept docs, style guides, etc.)
CREATE TABLE project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts (major divisions of the project)
CREATE TABLE parts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapters (within parts)
CREATE TABLE chapters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'done')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapter-specific documents
CREATE TABLE chapter_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Paragraphs (the actual written content)
CREATE TABLE paragraphs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  audio_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_parts_project_id ON parts(project_id);
CREATE INDEX idx_chapters_part_id ON chapters(part_id);
CREATE INDEX idx_chapter_documents_chapter_id ON chapter_documents(chapter_id);
CREATE INDEX idx_paragraphs_chapter_id ON paragraphs(chapter_id);

-- Enable Row Level Security (disabled for now since single user)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chapter_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE paragraphs ENABLE ROW LEVEL SECURITY;
