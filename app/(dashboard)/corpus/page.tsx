'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const documents = [
  {
    id: 'pru',
    code: 'PRU',
    type: 'rulebook',
    title: 'Prudential Rules (PRU) VER13',
    jurisdiction: 'FSRA',
    sections: 847,
    relevance: 95,
  },
  {
    id: 'cobs',
    code: 'COBS',
    type: 'rulebook',
    title: 'Conduct of Business Rules (COBS)',
    jurisdiction: 'FSRA',
    sections: 412,
    relevance: 88,
  },
  {
    id: 'gen',
    code: 'GEN',
    type: 'rulebook',
    title: 'General Rules (GEN)',
    jurisdiction: 'FSRA',
    sections: 234,
    relevance: 72,
  },
  {
    id: 'funds',
    code: 'FUNDS',
    type: 'rulebook',
    title: 'Funds Rules',
    jurisdiction: 'FSRA',
    sections: 198,
    relevance: 65,
  },
  {
    id: 'mkt',
    code: 'MKT',
    type: 'rulebook',
    title: 'Market Rules (MKT)',
    jurisdiction: 'FSRA',
    sections: 156,
    relevance: 58,
  },
  {
    id: 'employment',
    code: 'Employment',
    type: 'legislation',
    title: 'DIFC Employment Law No.2 of 2019',
    jurisdiction: 'DIFC',
    sections: 89,
    relevance: 45,
  },
]

export default function CorpusPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [jurisdiction, setJurisdiction] = useState('all')
  const [docType, setDocType] = useState('all')

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesJurisdiction =
      jurisdiction === 'all' || doc.jurisdiction === jurisdiction
    const matchesType = docType === 'all' || doc.type === docType
    return matchesSearch && matchesJurisdiction && matchesType
  })

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <div className="flex h-[48px] items-center gap-3 rounded-xl border border-[#E8EBF0] bg-white px-4">
          <Search className="size-4 text-[#9CA3AF]" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 2,484 documents across ADGM, DIFC and El Salvador..."
            className="flex-1 border-none bg-transparent text-[14px] outline-none placeholder:text-[#9CA3AF]"
          />
        </div>

        {/* Filters */}
        <div className="mt-2 flex gap-2">
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="h-[34px] rounded-md border border-[#E8EBF0] bg-white text-[13px]">
              <SelectValue placeholder="All jurisdictions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jurisdictions</SelectItem>
              <SelectItem value="FSRA">FSRA</SelectItem>
              <SelectItem value="DIFC">DIFC</SelectItem>
              <SelectItem value="El Salvador">El Salvador</SelectItem>
            </SelectContent>
          </Select>

          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="h-[34px] rounded-md border border-[#E8EBF0] bg-white text-[13px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="rulebook">Rulebook</SelectItem>
              <SelectItem value="guidance">Guidance</SelectItem>
              <SelectItem value="circular">Circular</SelectItem>
              <SelectItem value="judgment">Judgment</SelectItem>
              <SelectItem value="legislation">Legislation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="cursor-pointer rounded-lg border border-[#E8EBF0] bg-white p-4 transition-all hover:border-[#1A5FA8] hover:shadow-sm"
          >
            {/* Top */}
            <div className="flex justify-between">
              <span className="rounded-sm bg-[#0B1829] px-2 py-0.5 font-mono text-[10px] text-white">
                {doc.code}
              </span>
              <span className="rounded-sm bg-[#F5F7FA] px-2 py-0.5 text-[10px] text-[#6B7280]">
                {doc.type}
              </span>
            </div>

            {/* Title */}
            <p className="mt-2 line-clamp-2 text-[13px] font-medium text-[#0B1829]">
              {doc.title}
            </p>

            {/* Meta */}
            <div className="mt-2 flex gap-3 text-[11px] text-[#9CA3AF]">
              <span>{doc.jurisdiction}</span>
              <span>{doc.sections} sections</span>
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[#22C55E]" />
                Current
              </span>
            </div>

            {/* Relevance bar */}
            <div className="mt-2 h-[2px] rounded-full bg-[#E8EBF0]">
              <div
                className="h-full rounded-full bg-[#1A5FA8]"
                style={{ width: `${doc.relevance}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex gap-6 border-t border-[#E8EBF0] pt-4 text-[12px] text-[#9CA3AF]">
        <span>2,484 documents</span>
        <span>63,397 sections</span>
        <span>Last updated: today</span>
      </div>
    </div>
  )
}
