# Script Doctor - Proximas Funcionalidades

Este documento lista as funcionalidades planejadas, organizadas por prioridade.

---

## Alta Prioridade (afeta o trabalho diario)

### Pagina do Capitulo

- [ ] **Interface coesa com colapsaveis**
  - Todas as secoes (Contexto, Conteudo Aprovado, Revisao, Criar) colapsaveis
  - Estado salvo em localStorage
  - Transicao suave
  - Icone de seta indicando estado

- [ ] **Barra visual de contexto**
  - Barra colorida mostrando % de tokens usados
  - Verde: < 50%
  - Amarelo: 50-80%
  - Vermelho: > 80%
  - Mostrar numeros: "~45k/72k tokens"

- [ ] **Ouvir paragrafo individual**
  - Botao play em cada paragrafo aprovado
  - Botao play em cada paragrafo pendente

- [ ] **Ouvir todos em sequencia**
  - Botao para ouvir todos os paragrafos aprovados em ordem
  - Indicador visual de qual paragrafo esta tocando
  - Botao para parar

- [ ] **Controle de velocidade do TTS**
  - Opcoes: 1x, 1.25x, 1.5x, 2x
  - Util para revisoes rapidas

- [ ] **Aprovar com comentario**
  - Aprova o paragrafo
  - Ja abre gravacao para instrucao do proximo

- [ ] **Reprovar com comentario**
  - Reprova o paragrafo
  - Ja abre gravacao para instrucoes de reescrita
  - Gera novos paragrafos automaticamente

- [ ] **Paragrafos aprovados colapsaveis**
  - Preview de ~50 caracteres quando fechado
  - Expande para ver texto completo
  - Facilita navegacao em capitulos longos

---

## Media Prioridade (qualidade de vida)

### Pagina do Capitulo

- [ ] **Mutar TTS durante gravacao**
  - Evita que o microfone capture o audio do TTS
  - Desmuta automaticamente ao parar gravacao

- [ ] **Status do capitulo**
  - Rascunho / Em progresso / Finalizado
  - Visivel no header

### Pagina do Projeto

- [ ] **Status dos capitulos**
  - Indicador visual do status de cada capitulo
  - Contagem de paragrafos/palavras

- [ ] **Visualizar documentos**
  - Expandir para ver conteudo do documento
  - Nao apenas o nome

- [ ] **Progresso visual**
  - Quantos capitulos por parte
  - % de capitulos finalizados

---

## Baixa Prioridade (pode vir depois)

### Pagina Home

- [ ] **Progresso dos projetos**
  - Quantas partes, quantos capitulos
  - % de conclusao

### Pagina do Projeto

- [ ] **Exportar PDF**
  - Gerar PDF do projeto completo
  - Opcao de enviar para revisores por email

- [ ] **Reordenar itens**
  - Drag and drop ou setas
  - Reordenar partes e capitulos

### Pagina do Capitulo

- [ ] **Reordenar paragrafos**
  - Mudar ordem dos paragrafos aprovados

- [ ] **Salvar audio dos paragrafos**
  - Guardar audio TTS no banco
  - Nao precisar regerar ao ouvir novamente

---

## Concluido

- [x] Criar/deletar projetos
- [x] Criar partes e capitulos
- [x] Upload de documentos (projeto e capitulo)
- [x] Geracao de 4 paragrafos via GPT-4o
- [x] TTS em portugues (UnrealSpeech)
- [x] Aprovar/reprovar paragrafos
- [x] Aprovar/reprovar todos
- [x] Transcricao de voz (OpenAI Whisper)
- [x] Contador de tokens basico
- [x] Botoes grandes mobile-first
- [x] Admin para prompt template e voz TTS
