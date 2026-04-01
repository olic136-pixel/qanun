'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import type { PreflightQuestion } from '@/lib/api/drafting'
import { VoiceOrb } from '@/components/qanun/voice/VoiceOrb'
import { extractQuestion } from '@/lib/voice/extractQuestion'

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
  questions: PreflightQuestion[],
  voiceMode = false
): string {
  function formatQuestion(q: PreflightQuestion): string {
    let line = `- ${q.key}: ${q.question}`
    if (q.hint) line += `\n  Hint: ${q.hint}`
    const ft = q.field_type as string
    if (ft === 'select' && q.options?.length) {
      line += `\n  Valid options (guide user to one of these): ${q.options.join(' | ')}`
    }
    if (ft === 'multi_select' && q.options?.length) {
      line += `\n  Valid options (user may select multiple): ${q.options.join(' | ')}`
    }
    if (ft === 'boolean') {
      line += `\n  Valid options: Yes | No`
    }
    if (ft === 'text_multiline') {
      line += `\n  Format: multi-line text — accept the answer across multiple sentences or lines`
    }
    if (ft === 'number') {
      line += `\n  Format: numeric value`
    }
    return line
  }

  const requiredFields = questions
    .filter(q => q.required)
    .map(formatQuestion)
    .join('\n')

  const optionalFields = questions
    .filter(q => !q.required)
    .map(formatQuestion)
    .join('\n')

  return `You are conducting a professional intake conversation to collect specific information before drafting a ${displayName} for a regulated financial services firm.

REQUIRED INFORMATION — collect all of these before signalling completion:
${requiredFields || 'None — all fields are optional for this document.'}

OPTIONAL INFORMATION — collect if the user knows it; do not block on these:
${optionalFields || 'None.'}

CONVERSATION RULES:
- Ask ONE question per message. Do not list all questions at once.
- Where a question has defined valid options, guide the user to choose one (or more, for multi-select). Present the options naturally: "The valid ratings are High, Medium-High, Medium, Low-Medium, or Low — which applies?"
- If a question already has a current_value provided, skip it with a brief confirmation: "I can see you've previously noted [value] — I'll carry that forward."
- Optional fields left blank will appear as [TO BE CONFIRMED BY ENTITY] in the document. Never block on these.
- For multi-line fields (board members, risk register, etc.) accept the full answer in one message — do not ask for it piece by piece.
- Keep the overall conversation to 5–10 exchanges. Move briskly through optional fields by grouping related ones if the user is cooperative.
- Once all required information is collected (or user has confirmed they cannot provide it), end your FINAL message with exactly: [PREFLIGHT COMPLETE]
- Do NOT use [PREFLIGHT COMPLETE] at any other point.
- Maintain a professional, concise register throughout — this is a legal document intake, not a chatbot conversation.

Begin with a single opening question for the first required piece of information not already provided.${voiceMode ? `

=== VOICE MODE — MODIFIED PROTOCOL ===
The user is speaking rather than typing:
- Accept spoken answers for ALL field types including select and multi-select. Resolve spoken answers to the nearest valid option — e.g. "medium high risk" resolves to "Medium-High", "yes" resolves to true for boolean fields. State the resolution explicitly so the user can correct it if wrong.
- A single spoken answer may address several pending fields. Check all pending fields after each answer before asking the next question.
- Keep framing brief — the user hears only the final question sentence, not the preamble.
- For multi-select fields, accept the full list in one answer — do not ask for items one by one.` : ''}`
}

function buildPreflightExtractionPrompt(questions: PreflightQuestion[]): string {
  const fieldDescriptions = questions.map(q => {
    let typeDesc: string
    switch (q.field_type as string) {
      case 'boolean':
        typeDesc = 'boolean or null'
        break
      case 'multi_select':
      case 'jurisdiction_multi':
        typeDesc = 'string[] or null'
        break
      case 'number':
        typeDesc = 'number or null'
        break
      case 'select':
        typeDesc = q.options?.length
          ? `one of [${q.options.map(o => `"${o}"`).join(', ')}] or null`
          : 'string or null'
        break
      default:
        typeDesc = 'string or null'
    }
    return `  "${q.key}": ${typeDesc}`
  }).join(',\n')

  return `Extract the answers given in this preflight conversation and return ONLY a valid JSON object.

FIELD DEFINITIONS:
{
${fieldDescriptions}
}

EXTRACTION RULES:
- For select fields: return the exact option string that best matches the user's answer, or null if not provided.
- For multi_select fields: return a JSON array of matching option strings, or null if not provided.
- For boolean fields: return true for yes/affirmative answers, false for no/negative, null if not mentioned.
- For number fields: return the numeric value extracted, or null.
- For text fields: return the user's answer as a clean string, removing filler phrases. For multi-line answers preserve the full text including line breaks.
- Return null for any field not mentioned or where the user indicated they do not know.
- Return ONLY the JSON object. No preamble, no markdown fences, no explanation.`
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
  const [voiceMode, setVoiceMode] = useState(false)
  const [autoStartRecording, setAutoStartRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  useEffect(() => {
    if (!voiceMode && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [voiceMode])

  async function openConversation() {
    setLoading(true)
    setErrorMsg('')
    const systemPrompt = buildPreflightSystemPrompt(displayName, questions, voiceMode)
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
      speakQuestion(assistantText)
    } catch {
      setErrorMsg('Failed to start preflight conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function speakQuestion(text: string) {
    if (!voiceMode) return
    const question = extractQuestion(text)
    if (!question) return
    if (audioRef.current) {
      audioRef.current.pause()
      if (audioRef.current.src.startsWith('blob:')) URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
    try {
      const res = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: question }),
      })
      if (!res.ok || res.status === 204) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        URL.revokeObjectURL(url)
        if (voiceMode) setAutoStartRecording(true)
      }
      await audio.play().catch(() => {})
    } catch {
      // TTS failure is non-fatal
    }
  }

  function handleVoiceTranscription(text: string) {
    setInput(text)
    setAutoStartRecording(false)
    textareaRef.current?.focus()
  }

  async function sendMessage() {
    if (!input.trim() || loading || done) return
    const userMessage = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)
    setErrorMsg('')

    const systemPrompt = buildPreflightSystemPrompt(displayName, questions, voiceMode)

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
      speakQuestion(assistantText)

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
        <>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setVoiceMode(v => !v)
                setAutoStartRecording(false)
              }}
              className={[
                'font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-1 transition-colors',
                voiceMode
                  ? 'bg-black text-white'
                  : 'text-black/30 hover:text-black border border-black/10',
              ].join(' ')}
            >
              {voiceMode ? '● VOICE ON' : 'VOICE'}
            </button>
            {voiceMode && (
              <span className="font-mono text-[9px] text-black/30 uppercase tracking-[0.1em]">
                press mic · speak · press to stop
              </span>
            )}
          </div>
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
            {voiceMode && (
              <VoiceOrb
                onTranscription={handleVoiceTranscription}
                onLivePreview={text => setInput(text)}
                onError={msg => setErrorMsg(msg)}
                disabled={loading || done}
                autoStart={autoStartRecording}
                onRecordingStateChange={recording => {
                  if (recording) setAutoStartRecording(false)
                }}
              />
            )}
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
        </>
      )}
    </div>
  )
}
