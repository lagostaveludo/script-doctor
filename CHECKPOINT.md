# Script Doctor - Checkpoint

**Data:** 2025-12-08
**Versao atual:** 0.4.0

## O que e

App de escrita assistida por IA para roteiristas, com foco em interacao por audio (voz para instrucoes, TTS para ouvir o conteudo gerado).

**Ver:** [WORKFLOW.md](./WORKFLOW.md) - Fluxo de trabalho detalhado do usuario
**Ver:** [ROADMAP.md](./ROADMAP.md) - Proximas funcionalidades planejadas

---

## Stack

- **Frontend/Backend:** Next.js 16 (App Router)
- **Database:** Supabase (projeto: xvljbezfmtnireoacbqx)
- **IA Geracao:** OpenAI GPT-4o
- **IA Transcricao:** OpenAI Whisper
- **TTS:** UnrealSpeech (vozes PT-BR: pm_alex, pm_santa, pf_dora)
- **Deploy:** Vercel (projeto: script-doctor-app)

## URLs

- **App:** https://script-doctor-app.vercel.app
- **GitHub:** https://github.com/lagostaveludo/script-doctor

---

## Documentos Relacionados

| Documento | Descricao |
|-----------|-----------|
| [WORKFLOW.md](./WORKFLOW.md) | Fluxo de trabalho do usuario - como usar a ferramenta |
| [ROADMAP.md](./ROADMAP.md) | Lista de funcionalidades planejadas por prioridade |
| [PROPOSAL.md](./PROPOSAL.md) | Proposta original do projeto |

---

## Funcionalidades Implementadas

- [x] Criar/deletar projetos
- [x] Criar partes e capitulos dentro de projetos
- [x] Deletar partes e capitulos
- [x] Upload de documentos de referencia (TXT/MD) no projeto
- [x] Upload de documentos de referencia no capitulo
- [x] Geracao de 4 paragrafos por vez via GPT-4o
- [x] TTS em portugues (UnrealSpeech)
- [x] Ouvir paragrafos (todos em sequencia)
- [x] Aprovar/reprovar paragrafos gerados
- [x] Aprovar/reprovar todos em lote
- [x] Transcricao de voz com OpenAI Whisper
- [x] Admin para editar prompt template
- [x] Admin para escolher voz TTS
- [x] Botoes grandes mobile-first
- [x] Versao visivel no canto inferior
- [x] Contador de tokens basico
- [x] Botao limpar instrucao

**Proximas funcionalidades:** Ver [ROADMAP.md](./ROADMAP.md)

---

## Estrutura do Banco (Supabase)

```
projects
  └── project_documents
  └── parts
        └── chapters
              └── chapter_documents
              └── paragraphs

settings (id='default')
  - prompt_template
  - tts_voice
```

---

## Como Fazer Deploy

```bash
cd C:\Users\manu\dev\script-doctor
vercel deploy --token VLvKhX32JOXVBnN4wkkYAyph --prod --force --yes
```

---

## Variaveis de Ambiente (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xvljbezfmtnireoacbqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
UNREALSPEECH_API_KEY=mmgVKNIxJ18n...
```

---

## Arquivos Principais

| Arquivo | Descricao |
|---------|-----------|
| `src/app/page.tsx` | Home (lista de projetos) |
| `src/app/project/[id]/page.tsx` | Pagina do projeto (partes/capitulos) |
| `src/app/chapter/[id]/page.tsx` | Pagina de escrita do capitulo |
| `src/app/admin/page.tsx` | Configuracoes |
| `src/app/api/transcribe/route.ts` | Transcricao com OpenAI Whisper |
| `src/app/api/tts/route.ts` | TTS com UnrealSpeech |
| `src/app/api/chapters/[id]/generate/route.ts` | Geracao de paragrafos |
| `src/lib/openai.ts` | Integracao com GPT-4o e prompt template |
| `src/lib/supabase.ts` | Cliente Supabase |
