'use server'

import { createClient } from '@/lib/supabase/server'

interface CommitData {
  sha: string
  message: string
}

interface SummarizeRequest {
  repoName: string
  commits: CommitData[]
  languages: string[]
}

export async function summarizeRepo(request: SummarizeRequest) {
  // Verify authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { success: false, error: 'AI service not configured' }
  }

  const { repoName, commits, languages } = request

  // Build a concise summary of the commits for context
  const commitSummary = commits
    .slice(0, 30) // limit to 30 most recent commits
    .map(c => `- ${c.message}`)
    .join('\n')

  const techStackStr = languages.length > 0 
    ? `Tech Stack detected: ${languages.join(', ')}`
    : 'Tech stack not detected from repository metadata.'

  const prompt = `You are writing a project entry for a software developer's CV/resume.

INPUT DATA:
- Repository name: ${repoName}
- ${techStackStr}
- Recent commit messages (most recent first):
${commitSummary}


TASK:
Write a 2–3 sentence project description suitable for a CV. Base it strictly on the data above — do not invent features or outcomes not evidenced by the commits.

REQUIREMENTS:
- Open with an action verb (Built, Developed, Created, Designed, Implemented)
- Sentence 1: What the project is and its core purpose
- Sentence 2: Key technical decisions or architecture (use the detected languages/stack)
- Sentence 3 (optional): A specific contribution or challenge evident from the commits
- Tone: Direct and factual — like a senior engineer wrote it, not a recruiter
- If commit messages are too vague to infer specifics, describe only what the repo name and stack confirm

HARD RULES:
- No buzzwords: no "leveraged", "utilized", "robust", "scalable", "seamless"
- No filler phrases: no "this project", "I was responsible for", "as a developer"
- No uncertainty hedges: no "appears to", "seems to", "likely"
- Output the description text only — no labels, no quotes, no explanation`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional CV writer that creates concise, impactful project descriptions.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errData)
      return { success: false, error: 'AI service request failed' }
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      return { success: false, error: 'No summary generated' }
    }

    return { success: true, summary }
  } catch (err) {
    console.error('AI summarization error:', err)
    return { success: false, error: 'Failed to generate summary' }
  }
}
