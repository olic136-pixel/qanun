'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import type { PreflightQuestion } from '@/lib/api/drafting'

type Message = { role: 'user' | 'assistant'; content: string }

interface Props {
  docType: string
  displayName: string
  questions: PreflightQuestion[]
  token: string
  onComplete: (answers: Record<string, unknown>) => void
  onBack: () => void
}

function buildPreflightSystemPrompt(
  displayName: string,
  questions: PreflightQuestion[]
): string {
  const requiredFields = questions
    .filter(q => q.required)
    .map(q => `- ${q.key}: ${q.question}${q.hint ? ` (${q.hint})` : ''}`)
    .join('\n')

  const optionalFields = questions
    .filter(q => !q.required)
    .map(q => `- ${q.key}: ${q.question}${q.hint ? ` (${q.hint})` : ''}`)
    .join('\n')

  return `You are collecting specific information needed before drafting a ${displayName} document for a regulated entity.

REQUIRED INFORMATION (must collect before signalling completion):
${requiredFields || 'None — all fields optional for this document.'}

OPTIONAL INFORMATION (collect if user knows; proceed if not):
${optionalFields || 'None.'}

RULES:
- Ask ONE question at a time, conversationally. Do not list all questions at once.
- If a question has a current value already provided, skip it or confirm it briefly.
- Answers left blank will appear as [TO BE CONFIRMED BY ENTITY] in the document — never block on optional questions.
- Keep the conversation brief: aim for 3–6 exchanges total.
- Once you have collected all required information (or confirmed the user cannot provide it), end your final message with exactly: [PREFLIGHT COMPLETE]
- Do not use [PREFLIGHT COMPLETE] at any other time.
- Do not use form or dropdown language.

Begin with a single opening question for the first required piece of information, framed as a professional intake question.`
}

function buildPreflightExtractionPrompt(questions: PreflightQuestion[]): string {
  const fieldList = questions.map(q =>
    `"${q.key}": ${q.field_type === 'boolean' ? 'boolean or null' : q.field_type === 'jurisdiction_multi' ? 'string[] or null' : 'string or null'}`
  ).join(', ')
  return `Extract answers from this conversation. Return ONLY a valid JSON object with these keys: {${fieldList}}. Set null for any field not mentioned. No preamble, no markdown fences.`
}

export function PreflightConversation({
  docType, displayName, questions, token, onComplete, onBack,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [input])

  useEffect(() => {
    if (questions.length > 0 && messages.length === 0) {
      openConversation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions])

  async function openConversation() {
    setLoading(true)
    setErrorMsg('')
    const systemPrompt = buildPreflightSystemPrompt(displayName, questions)
    try {
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'I am ready to begin the preflight intake.' }],
        }),
      })
      const data = await res.json()
      const assistantText = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
      setMessages([{ role: 'assistant', content: assistantText }])
    } catch {
      setErrorMsg('Failed to start preflight conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || done) return
    const userMessage = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)
    setErrorMsg('')

    const systemPrompt = buildPreflightSystemPrompt(displayName, questions)

    try {
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: newMessages,
        }),
      })
      const data = await res.json()
      const assistantText = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
      const allMessages: Message[] = [...newMessages, { role: 'assistant', content: assistantText }]
      setMessages(allMessages)

      if (assistantText.includes('[PREFLIGHT COMPLETE]')) {
        setDone(true)
        setExtracting(true)
        const answers = await runExtraction(allMessages)
        onComplete(answers)
      }
    } catch {
      setErrorMsg('Message failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function runExtraction(msgs: Message[]): Promise<Record<string, unknown>> {
    const transcript = msgs.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
    const extractionPrompt = buildPreflightExtractionPrompt(questions)
    try {
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: extractionPrompt,
          messages: [{ role: 'user', content: `Extract answers from:\n\n${transcript}` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '{}'
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      return parsed as Record<string, unknown>
    } catch {
      return {}
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack}
        className="flex items-center gap-1 text-[12px] text-black/30 hover:text-black mb-4 transition-colors">
        <ArrowLeft size={12} /> Back to document selection
      </button>
      <h2 className="text-[18px] font-black uppercase tracking-tighter text-black mb-1">{displayName}</h2>
      <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.2em] mb-6">
        {docType.replace(/_/g, ' ')}
      </p>

      {/* Message thread */}
      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto mb-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-5`}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 bg-black flex items-center justify-center mb-1.5 shrink-0">
                <span className="text-white font-black text-[9px] leading-none">Q</span>
              </div>
            )}
            <div className={`max-w-[88%] text-[14px] leading-relaxed ${
              msg.role === 'user'
                ? 'text-black font-medium text-right border-r-2 border-black/20 pr-3'
                : 'text-black/70'
            }`}>
              {msg.content.replace('[PREFLIGHT COMPLETE]', '').trim()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-5 bg-black flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[9px] leading-none">Q</span>
            </div>
            <span className="font-mono text-[14px] text-black/30 animate-pulse">▊</span>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <p className="text-[12px] text-black mb-3">{errorMsg}</p>
      )}

      {/* Input or extracting state */}
      {done ? (
        <div className="flex items-center justify-center gap-2 py-4 font-mono text-[11px] text-black/40 uppercase tracking-[0.15em]">
          <Loader2 size={14} className="animate-spin" />
          Preparing draft…
        </div>
      ) : (
        <div className="border-t border-black/10 pt-3">
          <div className="flex gap-0 border border-black/20 focus-within:border-[#0047FF] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              disabled={loading}
              placeholder={loading ? '' : 'Type your answer…'}
              rows={1}
              className="flex-1 resize-none font-mono text-[12px] border-none px-3 py-2.5 focus:outline-none bg-white disabled:bg-white disabled:text-black/30 placeholder:text-black/30 max-h-[120px]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-10 bg-black text-white flex items-center justify-center hover:bg-[#0047FF] disabled:bg-black/20 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? <Loader2 size={13} className="animate-spin" />
                : <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5h9M7 2.5l4.5 4L7 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
              }
            </button>
          </div>
          <p className="font-mono text-[9px] text-black/20 uppercase tracking-[0.2em] mt-1.5 text-right">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  )
}
