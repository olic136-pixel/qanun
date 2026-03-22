'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  onCitationClick?: (citation: string) => void
}

function preprocessAnalysis(content: string): string {
  const RULEBOOKS =
    'PRU|COBS|GEN|MKT|FUNDS|PIB|COLL|FSMR|MAR|SUP|DTR|LR|BIPRU|GENPRU|SYSC|PRIN|MCOB|ICOBS|MCOBS|IFR|MiFID'

  // PASS 1: Full citations e.g. "PRU 1.3.2(a)" → `PRU 1.3.2(a)`
  let result = content.replace(
    new RegExp(
      `\\b(${RULEBOOKS})\\s+(\\d+\\.\\d+(?:\\.\\d+)?(?:\\([a-zA-Z\\d]+\\))*)`,
      'g'
    ),
    (match) => `\`${match}\``
  )

  // PASS 2: "Rule N.N.N" / "Rules N.N.N" patterns
  result = result.replace(
    /\b(Rules?\s+)(\d+\.\d+(?:\.\d+)?(?:\([a-zA-Z\d]+\))*)/g,
    (_match, prefix, num) => `${prefix}\`${num}\``
  )

  // PASS 3: Bare numbers after "or" / "and" e.g. "or 1.3.2"
  result = result.replace(
    /\b(or|and)\s+(\d+\.\d+(?:\.\d+)?(?:\([a-zA-Z\d]+\))*)(?!`)/g,
    (_match, conj, num) => `${conj} \`${num}\``
  )

  // PASS 4: Confidence labels
  result = result
    .replace(/\[VERIFIED\]/g, '`[VERIFIED]`')
    .replace(/\[SUPPORTED\]/g, '`[SUPPORTED]`')
    .replace(/\[INFERRED\]/g, '`[INFERRED]`')
    .replace(/\[SPECULATIVE\]/g, '`[SPECULATIVE]`')
    .replace(/\[CONTESTED\]/g, '`[CONTESTED]`')

  // PASS 5: Deduplicate double-wrapped backticks
  result = result.replace(/``([^`]+)``/g, '`$1`')

  return result
}

// TEST CASES for preprocessAnalysis:
// Input:  "The Guidance to PRU 1.3.2 provides that a Category 3A Authorised
//          Person is one whose FSP authorises it to carry on the Regulated
//          Activity of Dealing in Investments as Agent, and which does not
//          hold authorisation for the activities specified in Rules 1.3.1
//          (Category 1) or 1.3.2 (Category 2) [VERIFIED — PRU 1.3.2 (Guidance)]."
//
// Expected output (backtick-wrapped):
//   "...to `PRU 1.3.2` provides..."
//   "...in Rules `1.3.1` (Category 1) or `1.3.2` (Category 2)..."
//   "[`[VERIFIED]` — `PRU 1.3.2` (Guidance)]"

export function MarkdownRenderer({ content, className, onCitationClick }: MarkdownRendererProps) {
  return (
    <div className={cn('prose-qanun', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-[18px] font-medium text-[#0B1829] mt-6 mb-3 leading-snug">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[15px] font-medium text-[#0B1829] mt-5 mb-2 leading-snug border-b border-[#E8EBF0] pb-1.5">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-[13px] font-medium text-[#0B1829] mt-4 mb-1.5">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="text-[13px] text-[#111827] leading-relaxed mb-3">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-medium text-[#0B1829]">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="text-[#6B7280] not-italic">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="space-y-1 mb-3 ml-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 mb-3 ml-4 list-decimal">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[13px] text-[#111827] leading-relaxed pl-1">
            {children}
          </li>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4 rounded-lg border border-[#E8EBF0]">
            <table className="w-full text-[12px] border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#F5F7FA]">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-[11px] font-medium text-[#6B7280] uppercase tracking-[0.06em] border-b border-[#E8EBF0]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-[12px] text-[#111827] border-b border-[#F5F7FA] leading-relaxed">
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-[#F8FAFC] transition-colors">{children}</tr>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#C4922A] pl-3 py-1 bg-[#FFFBEB] rounded-r-md mb-3 text-[12px] text-[#92400E] leading-relaxed">
            {children}
          </blockquote>
        ),
        code: ({ children, className: codeClassName }) => {
          const text = String(children)
          const isBlock = codeClassName?.includes('language-')

          if (isBlock) {
            return (
              <pre className="bg-[#F5F7FA] border border-[#E8EBF0] rounded-lg p-3 mb-3 overflow-x-auto">
                <code className="font-mono text-[11px] text-[#0B1829]">
                  {children}
                </code>
              </pre>
            )
          }

          if (text === '[VERIFIED]') {
            return (
              <span className="inline-flex items-center font-mono text-[10px] font-medium bg-[#ECFDF5] text-[#166534] border border-[#86EFAC] rounded px-1.5 py-0.5 mx-0.5">
                {text}
              </span>
            )
          }
          if (text === '[SUPPORTED]') {
            return (
              <span className="inline-flex items-center font-mono text-[10px] font-medium bg-[#EFF6FF] text-[#0C447C] border border-[#85B7EB] rounded px-1.5 py-0.5 mx-0.5">
                {text}
              </span>
            )
          }
          if (text === '[INFERRED]') {
            return (
              <span className="inline-flex items-center font-mono text-[10px] font-medium bg-[#FFFBEB] text-[#92400E] border border-[#FCD34D] rounded px-1.5 py-0.5 mx-0.5">
                {text}
              </span>
            )
          }
          if (text === '[SPECULATIVE]' || text === '[CONTESTED]') {
            return (
              <span className="inline-flex items-center font-mono text-[10px] font-medium bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded px-1.5 py-0.5 mx-0.5">
                {text}
              </span>
            )
          }
          const RULEBOOK_PREFIXES = /^(PRU|COBS|GEN|MKT|FUNDS|PIB|COLL|FSMR|MAR|SUP|IFR|MiFID)\s/
          const BARE_RULE_NUMBER = /^\d+\.\d+(\.\d+)?(\([a-zA-Z\d]+\))*$/
          if (RULEBOOK_PREFIXES.test(text) || BARE_RULE_NUMBER.test(text)) {
            return (
              <button
                type="button"
                onClick={() => onCitationClick?.(text)}
                className="font-mono text-[11px] bg-[#EFF6FF] text-[#1A5FA8] border border-[#85B7EB] rounded px-1.5 py-0.5 mx-0.5 hover:bg-[#1A5FA8] hover:text-white transition-colors duration-100 cursor-pointer inline"
              >
                {text}
              </button>
            )
          }

          return (
            <code className="font-mono text-[11px] bg-[#F5F7FA] text-[#0B1829] border border-[#E8EBF0] rounded px-1.5 py-0.5">
              {children}
            </code>
          )
        },
        hr: () => <hr className="border-[#E8EBF0] my-4" />,
      }}
    >
      {preprocessAnalysis(content)}
    </ReactMarkdown>
    </div>
  )
}
