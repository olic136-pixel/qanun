export const tokens = {
  colors: {
    navy:   '#0B1829',
    blue:   '#1A5FA8',
    teal:   '#0F7A5F',
    gold:   '#C4922A',
    gray50: '#F5F7FA',
    gray100:'#E8EBF0',
    gray600:'#6B7280',
    gray900:'#111827',
    red:    '#991B1B',
  },
  fonts: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  motion: {
    fast:   '150ms ease',
    base:   '250ms ease',
    slow:   '400ms ease',
    reveal: '600ms cubic-bezier(0.16, 1, 0.3, 1)',
  }
} as const
