export type Slot = {
  date: string;      // YYYY-MM-DD
  time?: string;     // HH:mm
  capacity?: number;
  status: 'available' | 'full';
  meta?: Record<string, unknown>;
}

export interface Scraper {
  name: string;
  baseUrl: string;
  ratePerMin?: number;
  fetch: (args: { locationName?: string; params?: Record<string, string> }) => Promise<Slot[]>;
}

export function normalizeDate(input: string) {
  if (/\d{4}-\d{2}-\d{2}/.test(input)) return input
  const [dd, mm, yyyy] = input.split('/')
  return `${yyyy}-${mm}-${dd}`
}
