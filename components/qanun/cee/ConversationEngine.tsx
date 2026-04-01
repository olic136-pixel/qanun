'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Mic } from 'lucide-react'
import type { ExtractedEntityFields, EntityValidationResult } from '@/lib/api/entitySetup'
import { createOrUpdateSetupSession, validateEntityExtraction } from '@/lib/api/entitySetup'
import { VoiceOrb } from '@/components/qanun/voice/VoiceOrb'
import { extractQuestion } from '@/lib/voice/extractQuestion'

type Message = { role: 'user' | 'assistant'; content: string }
type CEEState = 'idle' | 'loading' | 'active' | 'extracting' | 'validating' | 'complete' | 'error'

interface Props {
  jurisdictionCode: string
  contextDocument: string
  token: string
  sessionId: string | null
  onFieldsUpdated: (fields: Partial<ExtractedEntityFields>) => void
  onExtractionComplete: (fields: ExtractedEntityFields, validationResult: EntityValidationResult) => void
  onSessionPersisted: (sessionId: string) => void
}

function buildSystemPrompt(contextDocument: string, jurisdictionCode: string, voiceMode = false): string {
  return `${contextDocument}

=== INTERROGATION PROTOCOL ===

You are a qualified regulatory counsel conducting an initial client intake interview for a regulated entity seeking a licence in ${jurisdictionCode}. Your role is to determine whether their proposed business is viable in this jurisdiction and to gather all information needed to create their entity record and initiate their governance document suite.

RULES:
- Ask exactly ONE focused question per response. Never ask multiple questions in a single message.
- Follow up on vague answers. If the user says "we manage money" ask: what type of clients — professional investors, retail, or both? Discretionary or advisory basis?
- Flag regulatory conflicts immediately in plain English as soon as you detect them.
- If the business described cannot be licensed in ${jurisdictionCode}, state this clearly, name the provision that creates the incompatibility, and offer to restart in the appropriate jurisdiction.
- Never use the words "form", "field", "dropdown", "checkbox", "select", or "submit".
- Placeholders are acceptable — if the user does not know a name yet, accept this and continue.
- When you have all required information, end your final message with exactly: [EXTRACTION READY]
- Do not use [EXTRACTION READY] at any other time for any reason.
- Be concise. This is a professional intake conversation, not a lecture.
- Never repeat information the user has already provided.
- Respond in the same language the user uses.

=== ENTITY SCHEMA — INFORMATION REQUIRED BEFORE [EXTRACTION READY] ===

MINIMUM REQUIRED (must have before signalling completion):
1. Legal entity name
2. Jurisdiction confirmed as viable (or incompatibility flagged)
3. Licence category confirmed
4. At least one permitted activity confirmed
5. Confirmation that business is viable in selected jurisdiction

COLLECT IF POSSIBLE (proceed if user cannot provide):
6. MLRO / Money Laundering Reporting Officer name
7. Compliance Officer name
8. Senior Executive Officer name
9. AUM range or assets under management scale

JURISDICTION-SPECIFIC — collect if jurisdiction is VARA:
- VASP licence type(s): BD (broker-dealer), EX (exchange), CUST (custody), MGMT (management), ADV (advisory), LB (lending/borrowing), TRS (transfer/settlement), ISS (issuance)
- Scope of virtual asset activities

JURISDICTION-SPECIFIC — collect if jurisdiction is EL_SALVADOR:
- DASP category from Art.19: exchange, custody, platform, structurer/adviser, transfer, investment
- Whether Bitcoin Law (Decreto 57) services apply
- Authorised capital amount in USD
- Name of local director / legal representative
- MLRO UIF registration number if known

Begin the conversation now with a warm, professional opening that confirms the jurisdiction and asks the user to describe their proposed business in their own words.${voiceMode ? `

=== VOICE MODE — MODIFIED PROTOCOL ===
The user is speaking rather than typing. Adjust your approach accordingly:
- After the opening response, a single spoken answer may address several required fields simultaneously. After each user message, check ALL required fields before deciding what to ask next — do not ask about anything already disclosed.
- If the user mentions a name, role, company, or relationship while answering a different question, capture it silently and do not ask again.
- Accept detailed, multi-sentence answers. Follow up one question at a time on genuine gaps only.
- The user can hear only the final question, not the framing — keep framing brief.` : ''}`
}

const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction engine processing a regulatory intake conversation. The conversation may have been conducted by voice — users speaking freely often disclose multiple pieces of information in a single answer. Extract EVERY piece of structured data mentioned, regardless of which question prompted it.

EXTRACTION RULES:
1. Extract all named individuals mentioned anywhere in the conversation — a user mentioning a name while answering a different question still populates the relevant field.
2. Extract all company names, system names, and third-party names: prime brokers, custodians, auditors, legal counsel, technology providers, screening providers.
3. When a user names multiple people in one answer, list all of them — do not abbreviate.
4. Extract financial figures mentioned in passing: AUM, capital, fee rates.
5. Extract role relationships mentioned: deputies, reporting lines, dual-role arrangements.
6. If a technology system is named (Bloomberg, World-Check, ComplySci, etc.) capture it even if unprompted.
7. Never leave a field null if the information was disclosed anywhere in the transcript.

Required JSON structure:
{
  "entity_name": string or null,
  "jurisdiction_code": string (ADGM|VARA|EL_SALVADOR),
  "licence_category": string (e.g. category_3c, VASP-BD, SV-DASP-EX) or null,
  "permitted_activities": string[],
  "entity_type": string (use same value as licence_category),
  "mlro_name": string or null,
  "compliance_name": string or null,
  "seo_name": string or null,
  "deputy_mlro_name": string or null,
  "board_chair": string or null,
  "board_members": string or null,
  "company_secretary": string or null,
  "controllers": string or null,
  "external_auditor": string or null,
  "legal_counsel": string or null,
  "prime_broker": string or null,
  "custodian": string or null,
  "screening_provider": string or null,
  "aum_range": string or null,
  "tier1_capital_usd": string or null,
  "staff_count_range": string or null,
  "primary_jurisdictions": string[] or null,
  "client_composition": string or null,
  "key_products": string[] or null,
  "internal_audit_arrangement": string or null,
  "idarc_name": string or null,
  "jurisdiction_specific": object (VARA: {vasp_licence_types, activity_scope}, EL_SALVADOR: {sv_licence_category, sv_activities, sv_bitcoin_services, sv_capital_amount, sv_local_director, sv_mlro_uif_reg} — include only fields mentioned),
  "recommended_tiers": number[] (always [1,2,3,4,5] unless user explicitly requested fewer),
  "validation_summary": string (one paragraph summarising all confirmed facts),
  "viability_confirmed": boolean,
  "alternative_jurisdiction": string or null
}

Return ONLY the JSON object. No other text.`

const CONTEXT_NARRATIVE_PROMPT = `You are reading a regulatory intake conversation. Extract qualitative narrative context that will be injected into compliance document drafting prompts as [ENTITY CONTEXT].

Return ONLY a valid JSON object:
{
  "context_narrative": string
}

The context_narrative should be 100–200 words capturing:
- How the business actually operates (beyond its licence category label)
- Key structural relationships: JV arrangements, group structures, parent entities, ownership context
- Strategic context: phased plans, technology dependencies, market positioning, intended client characteristics
- Any regulatory concerns, complications, or unusual structures surfaced

Write as a briefing note for a senior compliance counsel. Do not repeat purely structural fields (entity name, licence category, permitted activities list). Capture only qualitative nuance. If no meaningful qualitative context was disclosed, return a single sentence summary.

Return ONLY the JSON object. No other text.`

export function ConversationEngine({
  jurisdictionCode, contextDocument, token, sessionId,
  onFieldsUpdated, onExtractionComplete, onSessionPersisted,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [ceeState, setCeeState] = useState<CEEState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId)
  const [lastFields, setLastFields] = useState<Partial<ExtractedEntityFields>>({})
  const [voiceMode, setVoiceMode] = useState(false)
  const [autoStartRecording, setAutoStartRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [input])

  // Open conversation on mount
  useEffect(() => {
    if (contextDocument && messages.length === 0) {
      openConversation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextDocument])

  useEffect(() => {
    if (!voiceMode && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [voiceMode])

  async function openConversation() {
    setCeeState('loading')
    setErrorMsg('')
    const systemPrompt = buildSystemPrompt(contextDocument, jurisdictionCode, voiceMode)
    try {
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Hello, I am ready to begin.' }],
        }),
      })
      const data = await res.json()
      const assistantText = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
      setMessages([{ role: 'assistant', content: assistantText }])
      setCeeState('active')
      speakQuestion(assistantText)
    } catch {
      setErrorMsg('Failed to start conversation. Please refresh.')
      setCeeState('error')
    }
  }

  async function sendMessage() {
    if (!input.trim() || ceeState !== 'active') return
    const userMessage = input.trim()
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setCeeState('loading')

    const systemPrompt = buildSystemPrompt(contextDocument, jurisdictionCode, voiceMode)

    try {
      // Persist session in background (do not await)
      persistSession(newMessages, lastFields)

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

      // Fire partial extraction in background (do not await)
      runPartialExtraction(allMessages)

      // Check for completion signal
      if (assistantText.includes('[EXTRACTION READY]')) {
        setCeeState('extracting')
        await runFullExtractionAndValidation(allMessages)
      } else {
        setCeeState('active')
      }
    } catch {
      setErrorMsg('Message failed. Please try again.')
      setCeeState('active')
    }
  }

  async function persistSession(msgs: Message[], fields: Partial<ExtractedEntityFields>) {
    try {
      const summary = msgs.map(m => `${m.role}: ${m.content.slice(0, 100)}`).join('\n')
      const result = await createOrUpdateSetupSession({
        session_id: currentSessionId ?? undefined,
        jurisdiction_code: jurisdictionCode,
        confirmed_fields: fields as Record<string, unknown>,
        conversation_summary: summary,
      }, token)
      if (!currentSessionId) {
        setCurrentSessionId(result.session_id)
        onSessionPersisted(result.session_id)
      }
    } catch {
      // non-fatal — session persistence failure does not block conversation
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
      // TTS failure is non-fatal — conversation continues in text mode
    }
  }

  function handleVoiceTranscription(text: string) {
    setInput(text)
    setAutoStartRecording(false)
    textareaRef.current?.focus()
  }

  async function runNarrativeExtraction(msgs: Message[]) {
    try {
      const transcript = msgs.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          system: CONTEXT_NARRATIVE_PROMPT,
          messages: [{ role: 'user', content: `Extract narrative context from this conversation:\n\n${transcript}` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '{}'
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      if (parsed.context_narrative) {
        await persistSession(msgs, { ...lastFields, context_narrative: parsed.context_narrative } as unknown as Partial<ExtractedEntityFields>)
      }
    } catch {
      // non-fatal
    }
  }

  async function runPartialExtraction(msgs: Message[]) {
    try {
      const recentMessages = msgs.slice(-6)
      const transcript = recentMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Extract fields from this conversation transcript:\n\n${transcript}` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setLastFields(parsed)
      onFieldsUpdated(parsed)
    } catch {
      // silent — partial extraction is best-effort
    }
  }

  async function runFullExtractionAndValidation(msgs: Message[]) {
    setCeeState('extracting')
    try {
      const transcript = msgs.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
      const res = await fetch('/api/cee/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Extract all fields from this complete conversation transcript:\n\n${transcript}` }],
        }),
      })
      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
      const extracted: ExtractedEntityFields = JSON.parse(text.replace(/```json|```/g, '').trim())

      setLastFields(extracted)
      onFieldsUpdated(extracted)

      // Now validate
      setCeeState('validating')
      const validation = await validateEntityExtraction({
        jurisdiction_code: extracted.jurisdiction_code,
        licence_category: extracted.licence_category ?? '',
        entity_name: extracted.entity_name ?? '',
        permitted_activities: extracted.permitted_activities,
        entity_type: extracted.entity_type,
        mlro_name: extracted.mlro_name ?? undefined,
        compliance_name: extracted.compliance_name ?? undefined,
        seo_name: extracted.seo_name ?? undefined,
        jurisdiction_specific: extracted.jurisdiction_specific,
        viability_confirmed: extracted.viability_confirmed,
        alternative_jurisdiction: extracted.alternative_jurisdiction ?? undefined,
      }, token)

      setCeeState('complete')
      onExtractionComplete(extracted, validation)
      runNarrativeExtraction(msgs).catch(() => {})
    } catch {
      setErrorMsg('Extraction failed. Please continue the conversation.')
      setCeeState('active')
    }
  }

  const statusLabel = {
    idle: '', loading: 'Thinking…', active: '',
    extracting: 'Extracting entity data…',
    validating: 'Validating against corpus…',
    complete: 'Ready to confirm', error: 'Error',
  }[ceeState]

  return (
    <div className="flex flex-col h-full">
      {/* Message thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2">
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
              {msg.content.replace('[EXTRACTION READY]', '').trim()}
            </div>
          </div>
        ))}
        {ceeState === 'loading' && (
          <div className="flex items-center gap-2 mb-5">
            <div className="w-5 h-5 bg-black flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[9px] leading-none">Q</span>
            </div>
            <span className="font-mono text-[14px] text-black/30 animate-pulse">▊</span>
          </div>
        )}
      </div>

      {/* Status bar */}
      {(statusLabel || errorMsg) && (
        <div className={`py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.15em] ${
          errorMsg ? 'text-black' : 'text-black/30'
        }`}>
          {errorMsg || statusLabel}
        </div>
      )}

      {/* Input area — disabled when extracting/validating/complete */}
      {ceeState !== 'complete' && (
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
                : 'text-black/60 hover:text-black border border-black/30',
            ].join(' ')}
          >
            {voiceMode ? '● VOICE ON' : <><Mic size={11} className="inline-block mr-1 -mt-px" />VOICE</>}
          </button>
          {voiceMode && (
            <span className="font-mono text-[9px] text-black/30 uppercase tracking-[0.1em]">
              press mic · speak · press to stop
            </span>
          )}
        </div>
      )}
      {ceeState !== 'complete' && (
        <div className="border-t border-black/10 pt-3 mt-2">
          <div className="flex gap-0 border border-black/20 focus-within:border-[#0047FF] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
              }}
              disabled={ceeState !== 'active'}
              placeholder={ceeState === 'loading' ? '' : 'Type your answer…'}
              rows={1}
              className="flex-1 resize-none font-mono text-[12px] border-none px-3 py-2.5 focus:outline-none bg-white disabled:bg-white disabled:text-black/30 placeholder:text-black/30 max-h-[120px]"
            />
            {voiceMode && (
              <VoiceOrb
                onTranscription={handleVoiceTranscription}
                onLivePreview={text => setInput(text)}
                onError={msg => setErrorMsg(msg)}
                disabled={ceeState !== 'active'}
                autoStart={autoStartRecording}
                onRecordingStateChange={recording => {
                  if (recording) setAutoStartRecording(false)
                }}
              />
            )}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || ceeState !== 'active'}
              className="w-10 bg-black text-white flex items-center justify-center hover:bg-[#0047FF] disabled:bg-black/20 disabled:cursor-not-allowed transition-colors"
            >
              {ceeState === 'loading'
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
