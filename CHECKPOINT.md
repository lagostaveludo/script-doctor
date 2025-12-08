# Script Doctor - Checkpoint

**Data:** 2025-12-08
**Versão atual:** 0.2.0

## O que é

App de escrita assistida por IA para roteiristas, com foco em interação por áudio (voz para instruções, TTS para ouvir o conteúdo gerado).

## Stack

- **Frontend/Backend:** Next.js 16 (App Router)
- **Database:** Supabase (projeto: xvljbezfmtnireoacbqx)
- **IA:** OpenAI GPT-4o
- **TTS:** UnrealSpeech (vozes PT-BR: pm_alex, pm_santa, pf_dora)
- **Deploy:** Vercel (projeto: script-doctor-app)

## URLs

- **App:** https://script-doctor-app.vercel.app
- **GitHub:** https://github.com/lagostaveludo/script-doctor

## PROBLEMA ATUAL: Transcrição de voz não funciona

### Sintomas:
- Botão GRAVAR funciona (muda de cor)
- Barra de nível de áudio funciona (mostra som sendo capturado)
- Microfone está capturando áudio corretamente
- MAS: Nenhum texto é transcrito
- Nenhum erro aparece no console do navegador
- Nenhum feedback de que algo deu errado

### O que já tentamos:
1. Verificar se SpeechRecognition está disponível - SIM
2. Adicionar logs detalhados - não mostram erros
3. Reescrever página do zero - mesmo problema
4. Testar em localhost no Chrome desktop - não funciona

### Hipóteses:
1. **Web Speech API pode precisar de HTTPS** mesmo no Chrome desktop moderno
2. **Algo no código está impedindo** os eventos de result de disparar
3. **Problema de permissões** que não está gerando erro visível

### Próximo passo sugerido:
- Fazer deploy no Vercel e testar com HTTPS
- Se funcionar no Vercel: problema é localhost/HTTPS
- Se não funcionar: problema é no código

## Funcionalidades implementadas

- [x] Criar/deletar projetos
- [x] Criar partes e capítulos dentro de projetos
- [x] Deletar partes e capítulos
- [x] Upload de documentos de referência (TXT/MD) no projeto
- [x] Upload de documentos de referência no capítulo
- [x] Geração de 4 parágrafos por vez via GPT-4o
- [x] TTS em português (UnrealSpeech)
- [x] Ouvir parágrafos individualmente ou todos
- [x] Aprovar/reprovar parágrafos gerados
- [x] Admin para editar prompt template
- [x] Admin para escolher voz TTS
- [x] Botões grandes mobile-first (v0.2.0)
- [x] Versão visível no canto inferior (v0.2.0)
- [ ] **TRANSCRIÇÃO DE VOZ - NÃO FUNCIONA**
- [ ] Contador de tokens (removido temporariamente na v0.2.0)
- [ ] Seletor de microfone (removido temporariamente na v0.2.0)

## Estrutura do banco (Supabase)

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

## Como fazer deploy

```bash
cd C:\Users\manu\dev\script-doctor
vercel deploy --token VLvKhX32JOXVBnN4wkkYAyph --prod --force --yes
```

## Variáveis de ambiente (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://xvljbezfmtnireoacbqx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-proj-...
UNREALSPEECH_API_KEY=mmgVKNIxJ18n...
```

## Arquivos principais

- `src/app/page.tsx` - Home (lista de projetos)
- `src/app/project/[id]/page.tsx` - Página do projeto (partes/capítulos)
- `src/app/chapter/[id]/page.tsx` - Página de escrita do capítulo (PROBLEMA AQUI)
- `src/app/admin/page.tsx` - Configurações
- `src/lib/openai.ts` - Integração com GPT-4o e prompt template
- `src/lib/supabase.ts` - Cliente Supabase
- `src/app/api/tts/route.ts` - Integração UnrealSpeech
