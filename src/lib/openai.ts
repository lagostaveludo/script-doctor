import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Default prompt template with placeholders
export const DEFAULT_PROMPT_TEMPLATE = `Você é um escritor profissional trabalhando como ghostwriter/Script Doctor. Seu trabalho é escrever conteúdo narrativo de alta qualidade seguindo as instruções e o contexto fornecido.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Sua resposta DEVE seguir este formato exato:

---EXPLICACAO---
(Escreva aqui 1-2 frases explicando suas escolhas narrativas: por que escolheu este tom, esta sequência de eventos, ou como interpretou a instrução do usuário)

---PARAGRAFOS---
(Escreva aqui exatamente 4 parágrafos de conteúdo narrativo, separados por linha em branco)

REGRAS:
1. Escreva EXATAMENTE 4 parágrafos na seção PARAGRAFOS
2. A explicação deve ser breve (1-2 frases) e útil para o roteirista entender suas escolhas
3. Mantenha consistência com o estilo e tom dos documentos de referência
4. Continue a narrativa de forma fluida a partir do conteúdo já escrito

CONTEXTO DO PROJETO:
{{PROJECT_CONTEXT}}

CONTEÚDO JÁ ESCRITO NESTE CAPÍTULO:
{{CHAPTER_CONTENT}}`

export interface GenerationResult {
  paragraphs: string[]
  explanation: string
}

export async function generateParagraphs(
  systemContext: string,
  chapterContent: string,
  userInstruction: string,
  promptTemplate?: string
): Promise<GenerationResult> {
  // Use custom template or default
  const template = promptTemplate || DEFAULT_PROMPT_TEMPLATE

  // Replace placeholders
  const systemPrompt = template
    .replace('{{PROJECT_CONTEXT}}', systemContext)
    .replace('{{CHAPTER_CONTENT}}', chapterContent || '(Início do capítulo - ainda não há conteúdo escrito)')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-2024-11-20',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInstruction || 'Continue a narrativa com os próximos 4 parágrafos.' }
    ],
    temperature: 0.8,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || ''

  // Parse the structured response
  let explanation = ''
  let paragraphsText = content

  // Try to extract explanation and paragraphs from structured format
  const explanationMatch = content.match(/---EXPLICACAO---\s*([\s\S]*?)(?=---PARAGRAFOS---|$)/i)
  const paragraphsMatch = content.match(/---PARAGRAFOS---\s*([\s\S]*)/i)

  if (explanationMatch && paragraphsMatch) {
    explanation = explanationMatch[1].trim()
    paragraphsText = paragraphsMatch[1].trim()
  }

  // Split by double newlines to get paragraphs
  const paragraphs = paragraphsText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .slice(0, 4) // Ensure max 4 paragraphs

  return { paragraphs, explanation }
}

export function countTokensEstimate(text: string): number {
  // Rough estimate: ~4 characters per token for Portuguese
  return Math.ceil(text.length / 4)
}
