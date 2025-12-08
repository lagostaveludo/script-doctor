import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Default prompt template with placeholders
export const DEFAULT_PROMPT_TEMPLATE = `Você é um escritor profissional trabalhando como ghostwriter/Script Doctor. Seu trabalho é escrever conteúdo narrativo de alta qualidade seguindo as instruções e o contexto fornecido.

REGRAS IMPORTANTES:
1. Responda APENAS com o conteúdo dos parágrafos, sem enunciados, explicações ou comentários
2. Escreva EXATAMENTE 4 parágrafos
3. Separe cada parágrafo com uma linha em branco
4. Mantenha consistência com o estilo e tom dos documentos de referência
5. Continue a narrativa de forma fluida a partir do conteúdo já escrito

CONTEXTO DO PROJETO:
{{PROJECT_CONTEXT}}

CONTEÚDO JÁ ESCRITO NESTE CAPÍTULO:
{{CHAPTER_CONTENT}}`

export async function generateParagraphs(
  systemContext: string,
  chapterContent: string,
  userInstruction: string,
  promptTemplate?: string
): Promise<string[]> {
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

  // Split by double newlines to get paragraphs
  const paragraphs = content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .slice(0, 4) // Ensure max 4 paragraphs

  return paragraphs
}

export function countTokensEstimate(text: string): number {
  // Rough estimate: ~4 characters per token for Portuguese
  return Math.ceil(text.length / 4)
}
