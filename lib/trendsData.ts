import { loadAdData } from './csvLoader';

export interface TrendPoint {
  month: string;
  avgCPM: number;
  avgCPC: number;
  avgCTR: number;
  totalReach: number;
  count: number;
}

export interface IndustryTrend {
  industry: string;
  trends: TrendPoint[];
}

export interface SeasonInsight {
  month: string;
  industry: string;
  avgCPM: number;
  avgCPC: number;
  avgCTR: number;
  totalReach: number;
  totalSpend: number;
  count: number;
}

export function getTrends(
  industry?: string,
  gender?: string,
  ageRange?: string,
): IndustryTrend[] {
  const data = loadAdData();

  let filtered = data;
  if (gender && gender !== '전체') filtered = filtered.filter((r) => r.성별 === gender);
  if (ageRange && ageRange !== '전체') filtered = filtered.filter((r) => r.연령 === ageRange);

  const industries = industry && industry !== '전체'
    ? [industry]
    : [...new Set(filtered.map((r) => r.업종))];

  return industries.map((ind) => {
    const indData = filtered.filter((r) => r.업종 === ind);

    // Group by month (보고종료 기준)
    const monthMap = new Map<string, typeof indData>();
    for (const r of indData) {
      const month = r.보고종료.slice(0, 7); // YYYY-MM
      if (!month) continue;
      if (!monthMap.has(month)) monthMap.set(month, []);
      monthMap.get(month)!.push(r);
    }

    const trends: TrendPoint[] = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, records]) => {
        const totalImpressions = records.reduce((s, r) => s + r.노출, 0);
        const totalClicks = records.reduce((s, r) => s + r.클릭, 0);
        const avgCPM = totalImpressions > 0
          ? records.reduce((s, r) => s + r.CPM * r.노출, 0) / totalImpressions
          : 0;
        const avgCPC = totalClicks > 0
          ? records.reduce((s, r) => s + r.CPC * r.클릭, 0) / totalClicks
          : 0;
        const avgCTR = records.length > 0
          ? records.reduce((s, r) => s + r.CTR, 0) / records.length * 100
          : 0;
        const totalReach = records.reduce((s, r) => s + r.도달, 0);

        return {
          month,
          avgCPM: Math.round(avgCPM),
          avgCPC: Math.round(avgCPC),
          avgCTR: parseFloat(avgCTR.toFixed(4)),
          totalReach,
          count: records.length,
        };
      });

    return { industry: ind, trends };
  });
}

export function getSeasonInsights(): SeasonInsight[] {
  const data = loadAdData();

  const groupMap = new Map<string, typeof data>();
  for (const r of data) {
    const month = r.보고종료.slice(0, 7);
    if (!month) continue;
    const key = `${month}__${r.업종}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(r);
  }

  return [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, records]) => {
      const [month, industry] = key.split('__');
      const totalImpressions = records.reduce((s, r) => s + r.노출, 0);
      const totalClicks = records.reduce((s, r) => s + r.클릭, 0);
      const avgCPM = totalImpressions > 0
        ? records.reduce((s, r) => s + r.CPM * r.노출, 0) / totalImpressions
        : 0;
      const avgCPC = totalClicks > 0
        ? records.reduce((s, r) => s + r.CPC * r.클릭, 0) / totalClicks
        : 0;
      const avgCTR = records.length > 0
        ? records.reduce((s, r) => s + r.CTR, 0) / records.length * 100
        : 0;
      const totalReach = records.reduce((s, r) => s + r.도달, 0);
      const totalSpend = records.reduce((s, r) => s + r.지출금액, 0);

      return {
        month,
        industry,
        avgCPM: Math.round(avgCPM),
        avgCPC: Math.round(avgCPC),
        avgCTR: parseFloat(avgCTR.toFixed(4)),
        totalReach,
        totalSpend,
        count: records.length,
      };
    });
}
