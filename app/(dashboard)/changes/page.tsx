'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ChangeType = 'addition' | 'amendment' | 'deletion'

interface Change {
  id: string
  date: string
  jurisdiction: string
  document: string
  changeType: ChangeType
  summary: string
}

const changes: Change[] = [
  {
    id: '1',
    date: '21 Mar 2026',
    jurisdiction: 'FSRA',
    document: 'PRU 3.2.4',
    changeType: 'amendment',
    summary:
      'Updated capital adequacy ratios for Category 3C firms from 110% to 120%',
  },
  {
    id: '2',
    date: '19 Mar 2026',
    jurisdiction: 'FSRA',
    document: 'COBS 8.1.2',
    changeType: 'addition',
    summary:
      'New disclosure requirements for digital asset custody arrangements',
  },
  {
    id: '3',
    date: '15 Mar 2026',
    jurisdiction: 'ADGM',
    document: 'GEN 2.5.1',
    changeType: 'deletion',
    summary:
      'Removed transitional provisions for legacy licensing categories',
  },
  {
    id: '4',
    date: '12 Mar 2026',
    jurisdiction: 'FSRA',
    document: 'FUNDS 4.3.8',
    changeType: 'amendment',
    summary:
      'Revised redemption notice periods for open-ended domestic funds',
  },
  {
    id: '5',
    date: '8 Mar 2026',
    jurisdiction: 'FSRA',
    document: 'MKT 6.1.3',
    changeType: 'addition',
    summary:
      'Introduced market maker obligations for virtual asset exchanges',
  },
]

const changeTypeBadgeStyles: Record<ChangeType, string> = {
  addition: 'bg-[#ECFDF5] text-[#166534]',
  amendment: 'bg-[#FFFBEB] text-[#92400E]',
  deletion: 'bg-[#FEF2F2] text-[#991B1B]',
}

export default function ChangesPage() {
  return (
    <div>
      <h1 className="mb-5 text-[28px] font-medium text-[#0B1829]">
        Recent changes
      </h1>

      <div className="overflow-hidden rounded-lg border border-[#E8EBF0] bg-white">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#E8EBF0] bg-[#F5F7FA] hover:bg-[#F5F7FA]">
              <TableHead className="h-10 text-[11px] font-medium uppercase text-[#6B7280]">
                Date
              </TableHead>
              <TableHead className="h-10 text-[11px] font-medium uppercase text-[#6B7280]">
                Jurisdiction
              </TableHead>
              <TableHead className="h-10 text-[11px] font-medium uppercase text-[#6B7280]">
                Document
              </TableHead>
              <TableHead className="h-10 text-[11px] font-medium uppercase text-[#6B7280]">
                Change type
              </TableHead>
              <TableHead className="h-10 text-[11px] font-medium uppercase text-[#6B7280]">
                Summary
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.map((change) => (
              <TableRow
                key={change.id}
                className="border-b border-[#E8EBF0] last:border-b-0"
              >
                <TableCell className="text-[12px] text-[#0B1829]">
                  {change.date}
                </TableCell>
                <TableCell className="text-[12px] text-[#0B1829]">
                  {change.jurisdiction}
                </TableCell>
                <TableCell className="font-mono text-[12px] text-[#0B1829]">
                  {change.document}
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${changeTypeBadgeStyles[change.changeType]}`}
                  >
                    {change.changeType}
                  </span>
                </TableCell>
                <TableCell className="max-w-[300px] text-[12px] text-[#6B7280]">
                  {change.summary}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
