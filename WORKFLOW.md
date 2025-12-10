# Script Doctor - Fluxo de Trabalho

Este documento descreve o fluxo de trabalho esperado do usuário ao usar o Script Doctor.

---

## 1. Criar Projeto

O roteirista já tem um roteiro desenvolvido - tratamentos, escaletas, descrições de personagens, tom da obra. Ele cria um projeto e faz upload desses documentos de referência. Sao documentos que valem para a obra inteira.

**Exemplos de documentos do projeto:**
- Tratamento geral da historia
- Descricao de personagens
- Tom e estilo da narrativa
- Worldbuilding
- Referencias visuais ou literarias

---

## 2. Criar Partes

Partes sao divisoes grandes da obra. Por exemplo:
- **Livro:** Parte 1, Parte 2, Parte 3
- **Serie:** Temporada 1, Temporada 2
- **Filme longo:** Ato 1, Ato 2, Ato 3
- **Novela:** Fase 1, Fase 2

---

## 3. Criar Capitulos dentro das Partes

Cada parte tem capitulos. E a unidade de trabalho. Um capitulo pode ter documentos especificos - por exemplo, a escaleta detalhada daquele capitulo, notas sobre o que acontece naquela cena.

**Exemplos de documentos do capitulo:**
- Escaleta detalhada do capitulo
- Notas sobre a cena
- Dialogos ja pensados
- Referencias especificas

---

## 4. Trabalhar no Capitulo (onde o trabalho real acontece)

O roteirista abre o capitulo e:

### Ciclo de Trabalho

1. **Grava instrucao por voz:** "Comeca com o Joao entrando no bar, ele esta nervoso, procura alguem com os olhos"

2. **IA gera 4 paragrafos** de texto narrativo baseado na instrucao + documentos + contexto

3. **TTS le os paragrafos** para o roteirista ouvir

4. **Roteirista avalia** ouvindo:
   - Aprova os que estao bons
   - Reprova os que nao servem
   - Ou reprova com comentario: "esse paragrafo ficou muito descritivo, quero mais acao"

5. **Repete** ate o capitulo estar completo

6. O texto aprovado vai se acumulando, formando o capitulo escrito

### Revisao

A qualquer momento, o roteirista pode:
- Ouvir todos os paragrafos aprovados em sequencia
- Ouvir em velocidade acelerada (1.25x, 1.5x, 2x)
- Deletar paragrafos que nao servem mais
- Reordenar paragrafos se necessario

---

## 5. Finalizar

Quando todos os capitulos estao prontos:
- Exporta PDF do projeto completo
- Envia para revisores por email
- Marca projeto como finalizado

---

## O Papel da Voz

A interacao principal e por audio porque o roteirista esta "dirigindo" a escrita - ele fala o que quer, ouve o resultado, da feedback falado. E mais fluido que digitar.

**Entrada:** Voz (transcrita por Whisper)
**Saida:** Voz (TTS em portugues)

O campo de texto existe como alternativa, mas nao e o metodo principal.

---

## Contexto da IA

Ao gerar paragrafos, a IA recebe:
1. Documentos do projeto (contexto geral)
2. Documentos do capitulo (contexto especifico)
3. Paragrafos ja aprovados no capitulo (continuidade)
4. Instrucao do usuario (o que escrever agora)

Por isso e importante monitorar o uso de tokens - capitulos muito longos podem exceder o limite de contexto.
