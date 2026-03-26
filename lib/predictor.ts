import { AdRecord, loadAdData } from './csvLoader';

export interface PredictInput {
  industry: string;   // '전체' or specific industry
  gender: string;     // '전체', 'male', 'female'
  minAge: number;
  maxAge: number;
  budget: number;     // monthly budget in KRW
}

export interface PredictResult {
  reach: number;
  cpm: number;
  cpc: number;
  reachChange: number | null;
  cpmChange: number | null;
  cpcChange: number | null;
  matchedCount: number;
}

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const AGE_MAP: Record<string, [number, number]> = {
  '18-24': [18, 24],
  '25-34': [25, 34],
  '35-44': [35, 44],
  '45-54': [45, 54],
  '55-64': [55, 64],
  '65+':   [65, 99],
};

function ageRangeOverlaps(range: string, minAge: number, maxAge: number): boolean {
  const bounds = AGE_MAP[range];
  if (!bounds) return false;
  const [lo, hi] = bounds;
  return lo <= maxAge && hi >= minAge;
}

function filterRecords(
  data: AdRecord[],
  industry: string,
  gender: string,
  minAge: number,
  maxAge: number,
): AdRecord[] {
  return data.filter((r) => {
    if (industry !== '전체' && r.업종 !== industry) return false;
    if (gender !== '전체' && r.성별 !== gender) return false;
    if (!ageRangeOverlaps(r.연령, minAge, maxAge)) return false;
    return true;
  });
}

function weightedAvgCPM(records: AdRecord[]): number {
  const totalImpressions = records.reduce((s, r) => s + r.노출, 0);
  if (totalImpressions === 0) return 0;
  return records.reduce((s, r) => s + r.CPM * r.노출, 0) / totalImpressions;
}

function weightedAvgCPC(records: AdRecord[]): number {
  const totalClicks = records.reduce((s, r) => s + r.클릭, 0);
  if (totalClicks === 0) return 0;
  return records.reduce((s, r) => s + r.CPC * r.클릭, 0) / totalClicks;
}

function calcReach(records: AdRecord[], budget: number): number {
  const totalSpend = records.reduce((s, r) => s + r.지출금액, 0);
  const totalReach = records.reduce((s, r) => s + r.도달, 0);
  if (totalSpend === 0) return 0;
  return Math.round((totalReach / totalSpend) * budget);
}

export function predict(input: PredictInput): PredictResult {
  const data = loadAdData();
  const { industry, gender, minAge, maxAge, budget } = input;

  // Primary match
  let matched = filterRecords(data, industry, gender, minAge, maxAge);

  // Fallback levels
  if (matched.length === 0) {
    matched = filterRecords(data, industry, '전체', minAge, maxAge);
  }
  if (matched.length === 0) {
    matched = filterRecords(data, industry, '전체', 18, 99);
  }
  if (matched.length === 0) {
    matched = data;
  }

  const reach = calcReach(matched, budget);
  const cpm = weightedAvgCPM(matched);
  const cpc = weightedAvgCPC(matched);

  // Previous month comparison: filter by 보고종료 in previous month
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const prevMatched = matched.filter((r) => r.보고종료.startsWith(prevMonthStr));

  let reachChange: number | null = null;
  let cpmChange: number | null = null;
  let cpcChange: number | null = null;

  if (prevMatched.length > 0) {
    const prevReach = calcReach(prevMatched, budget);
    const prevCPM = weightedAvgCPM(prevMatched);
    const prevCPC = weightedAvgCPC(prevMatched);

    if (prevReach > 0) reachChange = ((reach - prevReach) / prevReach) * 100;
    if (prevCPM > 0) cpmChange = ((cpm - prevCPM) / prevCPM) * 100;
    if (prevCPC > 0) cpcChange = ((cpc - prevCPC) / prevCPC) * 100;
  }

  return {
    reach,
    cpm: Math.round(cpm),
    cpc: Math.round(cpc),
    reachChange,
    cpmChange,
    cpcChange,
    matchedCount: matched.length,
  };
}
