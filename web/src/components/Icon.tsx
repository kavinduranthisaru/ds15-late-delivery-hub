/** Line icons in the style of the reference (1.75 px stroke, rounded joins). */
const PATHS = {
  overview: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  grid: 'M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z',
  table: 'M4 5h16v14H4zM4 10h16M4 14.5h16M9.5 10v9',
  compare: 'M7 4v16M17 4v16M3 8h8M13 16h8',
  chart: 'M4 20h16M7 16v-4M12 16V8M17 16v-6',
  book: 'M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5zM5 19.5A1.5 1.5 0 006.5 21H19M9 7h6',
  predict: 'M4 17l5-5 4 4 7-8M15 8h5v5',
  about: 'M12 11v6M12 7.5v.5M12 21a9 9 0 100-18 9 9 0 000 18z',
  star: 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4.5v5M8 14.5v5',
  scale: 'M12 4v16M5 20h14M6 8l-3 6a3 3 0 006 0zM18 8l-3 6a3 3 0 006 0zM6 8h12',
  form: 'M5 4h14v16H5zM8.5 8.5h7M8.5 12h7M8.5 15.5h4',
  gauge: 'M4.5 16.5a8 8 0 1115 0M12 13l3.5-4',
  people: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.3a3.5 3.5 0 010 6.4M18 14a6.5 6.5 0 013.5 6',
  person: 'M11 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM4 20a7 7 0 0110.5-6M16.5 17l1.8 1.8L22 15',
  alert: 'M12 9v4M12 16.5v.5M10.3 4.3L2.6 18a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z',
  'circle-alert': 'M12 8v5M12 16v.5M12 21a9 9 0 100-18 9 9 0 000 18z',
  quote: 'M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  close: 'M6 6l12 12M18 6L6 18',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  'chevrons-left': 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
  'chevrons-right': 'M13 17l5-5-5-5M6 17l5-5-5-5',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  filter: 'M4 5h16l-6 7.5V19l-4-2v-4.5z',
  check: 'M5 12.5l4.5 4.5L19 7',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  more: 'M12 5.5v.01M12 12v.01M12 18.5v.01',
  'more-h': 'M5.5 12h.01M12 12h.01M18.5 12h.01',
  bookmark: 'M6 4h12v17l-6-4-6 4z',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  trophy: 'M8 4h8v5a4 4 0 01-8 0zM8 6H4.5a3 3 0 003.5 4M16 6h3.5a3 3 0 01-3.5 4M12 13v4M8.5 20h7M10 17h4',
  plus: 'M12 5v14M5 12h14',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, className = '', strokeWidth = 1.75 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>
      <path d={PATHS[name]} />
    </svg>
  )
}
