'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { ExtractedEntityFields, EntityValidationResult } from '@/lib/api/entitySetup'
import { createOrUpdateSetupSession, validateEntityExtraction } from '@/lib/api/entitySetup'

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

function buildSystemPrompt(contextDocument: string, jurisdictionCode: string): string {
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

Begin the conversation now with a warm, professional opening that confirms the jurisdiction and asks the user to describe their proposed business in their own words.`
}

const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction engine. You will be given a conversation transcript between a regulatory counsel AI and a client. Extract the following fields from the conversation and return ONLY a valid JSON object with no preamble, explanation, or markdown.

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
  "aum_range": string or null,
  "jurisdiction_specific": object (VARA: {vasp_licence_types, activity_scope}, EL_SALVADOR: {sv_licence_category, sv_activities, sv_bitcoin_services, sv_capital_amount, sv_local_director, sv_mlro_uif_reg} — include only fields mentioned in conversation),
  "recommended_tiers": number[] (always [1,2,3,4,5] unless user explicitly requested fewer tiers),
  "validation_summary": string (one paragraph summarising what was confirmed),
  "viability_confirmed": boolean,
  "alternative_jurisdiction": string or null
}

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  async function openConversation() {
    setCeeState('loading')
    setErrorMsg('')
    const systemPrompt = buildSystemPrompt(contextDocument, jurisdictionCode)
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

    const systemPrompt = buildSystemPrompt(contextDocument, jurisdictionCode)

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
